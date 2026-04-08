import Anthropic from '@anthropic-ai/sdk';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { streamToStdout, extractText } from '../lib/stream';
import { createReviewer } from '../lib/reviewer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

const client = new Anthropic();

function readExistingTestFiles(): string {
  const e2eDir = join(projectRoot, 'e2e');
  const lines: string[] = ['Existing test files (check these before creating any new page objects or spec files):'];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      if (statSync(abs).isDirectory()) {
        walk(abs);
      } else if (entry.endsWith('.ts')) {
        const rel = relative(projectRoot, abs);
        const content = readFileSync(abs, 'utf8');
        lines.push(`\n### ${rel}\n\`\`\`ts\n${content}\n\`\`\``);
      }
    }
  }

  walk(e2eDir);
  return lines.join('\n');
}

export async function structurePlannerAgent(approvedScenarios: string): Promise<string> {
  const existingFiles = readExistingTestFiles();

  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    system: `You are an expert test automation architect following the Page Object Model pattern.
Given approved test scenarios, design the automation structure. Do NOT write implementation code.

Your output must specify:
- Page object files: filename, class name, URL const, LOCATORS const entries, action methods (name + signature), locator accessor methods (name + return type)
- Spec files: filename, test names mapped to scenario numbers, which page object methods each test will call
- Any shared utilities or fixtures needed

IMPORTANT: Before planning any new file, check whether a page object or spec file already exists for that page or feature (shown in the user message).
- If a page object exists: extend it with new methods rather than creating a new file
- If a spec file exists: add new tests to it rather than creating a duplicate
- Only create a new file when no suitable existing file covers that page or feature

Be precise and complete — this spec will be handed directly to an engineer to implement.`,
    messages: [
      {
        role: 'user',
        content: `${existingFiles}\n\n---\n\nDesign the automation structure for these approved scenarios:\n\n${approvedScenarios}`,
      },
    ],
  });

  streamToStdout(stream, 'Planner: Designing automation structure');
  return extractText(stream);
}

//see reviewer.ts for configuration of this reviewer
export const structureReviewerAgent = createReviewer(
  'Reviewer: Structure validation',
  `You are a senior test automation architect. Review a proposed automation structure plan against the approved scenarios.

Check for:
- Every approved scenario has a corresponding test in the spec files
- No structural duplication (duplicate page objects, redundant methods)
- Drift from scenarios: methods or tests not traceable to an approved scenario
- Raw selectors in spec files (all selectors must live in LOCATORS in page objects)
- Method naming is clear and action-oriented

Flag each issue with the file and element it affects. Return an approved structure plan with any corrections applied.`
);
