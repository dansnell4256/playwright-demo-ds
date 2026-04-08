import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { ExecutionResult, VerificationResult } from '../phases/executor';

export type PhaseKey = 'phase1' | 'phase2' | 'phase3' | 'phase4';

export const PHASE_ORDER: PhaseKey[] = ['phase1', 'phase2', 'phase3', 'phase4'];

export interface RunMeta {
  runId: string;
  plan: string;
  startedAt: string;
  completedPhases: PhaseKey[];
  phaseTimestamps: Partial<Record<PhaseKey, string>>;
}

export interface PhaseArtifacts {
  scenarios: string;
  approvedScenarios: string;
  structurePlan: string;
  approvedStructurePlan: string;
  authorOutput: string;
  approvedAuthorOutput: string;
  execution: ExecutionResult;
  verification: VerificationResult;
}

export function runDir(outputDir: string, runId: string): string {
  return join(outputDir, 'runs', runId);
}

export function initRun(outputDir: string, runId: string, plan: string): void {
  const dir = runDir(outputDir, runId);
  mkdirSync(dir, { recursive: true });
  const meta: RunMeta = {
    runId,
    plan,
    startedAt: new Date().toISOString(),
    completedPhases: [],
    phaseTimestamps: {},
  };
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
}

export function saveText(outputDir: string, runId: string, filename: string, content: string): void {
  writeFileSync(join(runDir(outputDir, runId), filename), content, 'utf8');
}

export function saveJson<T>(outputDir: string, runId: string, filename: string, data: T): void {
  writeFileSync(join(runDir(outputDir, runId), filename), JSON.stringify(data, null, 2), 'utf8');
}

export function markPhaseComplete(outputDir: string, runId: string, phase: PhaseKey): void {
  const metaPath = join(runDir(outputDir, runId), 'meta.json');
  const meta: RunMeta = JSON.parse(readFileSync(metaPath, 'utf8'));
  if (!meta.completedPhases.includes(phase)) {
    meta.completedPhases.push(phase);
  }
  meta.phaseTimestamps[phase] = new Date().toISOString();
  writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
}

export function loadMeta(outputDir: string, runId: string): RunMeta {
  const metaPath = join(runDir(outputDir, runId), 'meta.json');
  if (!existsSync(metaPath)) {
    throw new Error(`Run not found: ${runId}. Expected meta.json at ${metaPath}`);
  }
  return JSON.parse(readFileSync(metaPath, 'utf8'));
}

export function loadArtifactsUpTo(
  outputDir: string,
  runId: string,
  resumeFrom: PhaseKey,
): Partial<PhaseArtifacts> {
  const meta = loadMeta(outputDir, runId);
  const dir = runDir(outputDir, runId);
  const resumeIndex = PHASE_ORDER.indexOf(resumeFrom);

  for (let i = 0; i < resumeIndex; i++) {
    const phase = PHASE_ORDER[i];
    if (!meta.completedPhases.includes(phase)) {
      throw new Error(
        `Cannot resume from ${resumeFrom}: ${phase} has not completed for run ${runId}. ` +
        `Completed phases: [${meta.completedPhases.join(', ')}]`,
      );
    }
  }

  function readTxt(filename: string): string {
    const p = join(dir, filename);
    if (!existsSync(p)) throw new Error(`Missing artifact for resume: ${p}`);
    return readFileSync(p, 'utf8');
  }

  function readJson<T>(filename: string): T {
    const p = join(dir, filename);
    if (!existsSync(p)) throw new Error(`Missing artifact for resume: ${p}`);
    return JSON.parse(readFileSync(p, 'utf8')) as T;
  }

  const artifacts: Partial<PhaseArtifacts> = {};

  if (resumeIndex > 0) {
    artifacts.scenarios = readTxt('phase1-scenarios.txt');
    artifacts.approvedScenarios = readTxt('phase1-approved-scenarios.txt');
  }
  if (resumeIndex > 1) {
    artifacts.structurePlan = readTxt('phase2-structure-plan.txt');
    artifacts.approvedStructurePlan = readTxt('phase2-approved-structure-plan.txt');
  }
  if (resumeIndex > 2) {
    artifacts.authorOutput = readTxt('phase3-author-output.txt');
    artifacts.approvedAuthorOutput = readTxt('phase3-approved-author-output.txt');
  }
  if (resumeIndex > 3) {
    artifacts.execution = readJson<ExecutionResult>('phase4-execution.json');
    artifacts.verification = readJson<VerificationResult>('phase4-verification.json');
  }

  return artifacts;
}

export function parsePhaseKey(value: string): PhaseKey {
  if (!PHASE_ORDER.includes(value as PhaseKey)) {
    throw new Error(
      `Invalid --resume-from value "${value}". Must be one of: ${PHASE_ORDER.join(', ')}`,
    );
  }
  return value as PhaseKey;
}
