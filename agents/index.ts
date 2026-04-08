import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { scenarioAgent, scenarioReviewerAgent } from './phases/scenario';
import { structurePlannerAgent, structureReviewerAgent } from './phases/structure';
import { authorAgent, authorReviewerAgent, writeTestFiles } from './phases/author';
import { testExecutorAgent, verifierAgent } from './phases/executor';
import type { ExecutionResult, VerificationResult } from './phases/executor';
import {
  initRun, saveText, saveJson, markPhaseComplete, loadArtifactsUpTo, parsePhaseKey,
  type PhaseKey,
} from './lib/artifacts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type { PhaseKey };

export interface PipelineOptions {
  resumeFrom?: PhaseKey;
  runId?: string;
}

export interface PipelineResult {
  runId: string;
  scenarios: string;
  approvedScenarios: string;
  structurePlan: string;
  approvedStructurePlan: string;
  authorOutput: string;
  approvedAuthorOutput: string;
  execution: ExecutionResult;
  verification: VerificationResult;
}

export async function runPipeline(plan: string, options: PipelineOptions = {}): Promise<PipelineResult> {
  const { resumeFrom, runId: providedRunId } = options;

  if (resumeFrom && !providedRunId) {
    throw new Error('--run-id is required when using --resume-from');
  }

  const outputDir = join(__dirname, 'output');
  const runId = providedRunId ?? new Date().toISOString().replace(/[:.]/g, '-');

  const loaded = resumeFrom && providedRunId
    ? loadArtifactsUpTo(outputDir, providedRunId, resumeFrom)
    : {};

  if (resumeFrom) {
    process.stdout.write(`\n[Resume] Run ${runId}, starting from ${resumeFrom}\n`);
  } else {
    initRun(outputDir, runId, plan);
    process.stdout.write(`\n[Pipeline] Run ID: ${runId}\n`);
  }

  // Phase 1: Scenario identification → review
  let scenarios: string;
  let approvedScenarios: string;

  if (loaded.scenarios !== undefined && loaded.approvedScenarios !== undefined) {
    scenarios = loaded.scenarios;
    approvedScenarios = loaded.approvedScenarios;
    process.stdout.write('\n[Phase 1] Loaded from artifacts\n');
  } else {
    scenarios = await scenarioAgent(plan);
    saveText(outputDir, runId, 'phase1-scenarios.txt', scenarios);

    approvedScenarios = await scenarioReviewerAgent(scenarios);
    saveText(outputDir, runId, 'phase1-approved-scenarios.txt', approvedScenarios);

    markPhaseComplete(outputDir, runId, 'phase1');
  }

  // Phase 2: Structure planning → review
  let structurePlan: string;
  let approvedStructurePlan: string;

  if (loaded.structurePlan !== undefined && loaded.approvedStructurePlan !== undefined) {
    structurePlan = loaded.structurePlan;
    approvedStructurePlan = loaded.approvedStructurePlan;
    process.stdout.write('\n[Phase 2] Loaded from artifacts\n');
  } else {
    structurePlan = await structurePlannerAgent(approvedScenarios);
    saveText(outputDir, runId, 'phase2-structure-plan.txt', structurePlan);

    approvedStructurePlan = await structureReviewerAgent(structurePlan, approvedScenarios);
    saveText(outputDir, runId, 'phase2-approved-structure-plan.txt', approvedStructurePlan);

    markPhaseComplete(outputDir, runId, 'phase2');
  }

  // Phase 3: Authoring → review → write to disk
  let authorOutput: string;
  let approvedAuthorOutput: string;

  if (loaded.authorOutput !== undefined && loaded.approvedAuthorOutput !== undefined) {
    authorOutput = loaded.authorOutput;
    approvedAuthorOutput = loaded.approvedAuthorOutput;
    process.stdout.write('\n[Phase 3] Loaded from artifacts (test files already on disk)\n');
  } else {
    authorOutput = await authorAgent(approvedStructurePlan);
    saveText(outputDir, runId, 'phase3-author-output.txt', authorOutput);

    approvedAuthorOutput = await authorReviewerAgent(authorOutput, approvedStructurePlan);
    saveText(outputDir, runId, 'phase3-approved-author-output.txt', approvedAuthorOutput);

    writeTestFiles(approvedAuthorOutput);
    markPhaseComplete(outputDir, runId, 'phase3');
  }

  // Phase 4: Execute tests, verify results, rerun once if flaky
  let execution = await testExecutorAgent();
  let verification = await verifierAgent(execution);

  if (verification.shouldRerun) {
    process.stdout.write('\n[Verifier] Rerunning tests...\n');
    execution = await testExecutorAgent();
    verification = await verifierAgent(execution);
  }

  saveJson(outputDir, runId, 'phase4-execution.json', execution);
  saveJson(outputDir, runId, 'phase4-verification.json', verification);
  markPhaseComplete(outputDir, runId, 'phase4');

  // Persist full pipeline summary
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = join(outputDir, `pipeline-${timestamp}.md`);

  writeFileSync(outputPath, [
    '# Pipeline Output',
    '',
    `Run ID: ${runId}`,
    '',
    '## Plan',
    plan.trim(),
    '',
    '## Phase 1: Identified Scenarios',
    scenarios,
    '',
    '## Phase 1 Review: Approved Scenarios',
    approvedScenarios,
    '',
    '## Phase 2: Automation Structure Plan',
    structurePlan,
    '',
    '## Phase 2 Review: Approved Structure',
    approvedStructurePlan,
    '',
    '## Phase 3: Authored Code',
    authorOutput,
    '',
    '## Phase 3 Review: Approved Code',
    approvedAuthorOutput,
    '',
    '## Phase 4: Execution Results',
    `Passed: ${execution.passed}`,
    `Failed: ${execution.failed}`,
    '',
    '```',
    execution.output,
    '```',
    '',
    '## Phase 4: Verification',
    `Verdict: ${verification.verdict}`,
    '',
    verification.analysis,
  ].join('\n'));

  process.stdout.write(`\n\n[Saved] ${outputPath}\n`);
  return { runId, scenarios, approvedScenarios, structurePlan, approvedStructurePlan, authorOutput, approvedAuthorOutput, execution, verification };
}

// --- CLI entry point: npx tsx agents/index.ts [--resume-from=phaseN] [--run-id=<id>] ---

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const eqMatch = argv[i].match(/^--([a-z-]+)=(.+)$/);
    if (eqMatch) { args[eqMatch[1]] = eqMatch[2]; continue; }
    const flagMatch = argv[i].match(/^--([a-z-]+)$/);
    if (flagMatch && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args[flagMatch[1]] = argv[++i];
    }
  }
  return args;
}

const examplePlan = `
Feature: Todo list management
- Users can add a todo item by typing in an input field and pressing Enter
- Users can mark a todo item as complete by clicking a checkbox
- Users can filter todos by: All, Active, Completed
- Users can delete a todo item
- The footer shows the count of remaining active items
`;

const argv = parseArgs(process.argv);
const options: PipelineOptions = {};

if (argv['resume-from']) {
  try {
    options.resumeFrom = parsePhaseKey(argv['resume-from']);
  } catch (err) {
    process.stderr.write(`\n[Error] ${(err as Error).message}\n`);
    process.exit(1);
  }
}
if (argv['run-id']) {
  options.runId = argv['run-id'];
}
if (options.resumeFrom && !options.runId) {
  process.stderr.write('\n[Error] --run-id is required when using --resume-from\n');
  process.exit(1);
}

runPipeline(examplePlan, options).then(({ runId, execution, verification }) => {
  process.stdout.write(`\n\n[Pipeline complete] Run ID: ${runId} | ${execution.passed} passed, ${execution.failed} failed — verdict: ${verification.verdict}\n`);
}).catch((err: Error) => {
  process.stderr.write(`\n[Error] ${err.message}\n`);
  process.exit(1);
});
