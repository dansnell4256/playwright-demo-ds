import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { streamToStdout, extractText } from '../lib/stream';
import { createReviewer } from '../lib/reviewer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

const client = new Anthropic();

export async function authorAgent(approvedStructurePlan: string): Promise<string> {
  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    system: `You are an expert test automation engineer implementing Playwright tests following the Page Object Model.

Implement the provided structure plan exactly. Rules:
- Page objects: URL const at top, LOCATORS const with all selectors, async action methods returning void, synchronous locator accessors returning Locator
- Spec files: no raw selectors, no test.beforeEach for navigation, each test calls goto() as its first line, no expect() in page objects
- Use TypeScript throughout

Return your output as a JSON array where each element is:
{ "filePath": "relative/path/from/project/root", "content": "full file content" }

Output ONLY the JSON array, no explanation, no markdown fences.`,
    messages: [
      { role: 'user', content: `Implement the following automation structure plan:\n\n${approvedStructurePlan}` },
    ],
  });

  streamToStdout(stream, 'Author: Writing test files');
  return extractText(stream);
}

//see reviewer.ts for configuration of this reviewer
export const authorReviewerAgent = createReviewer(
  'Reviewer: Code validation against plan',
  `You are a senior test automation reviewer. Review generated Playwright test code against the structure plan.

Check for:
- Every planned spec test is present and maps to a scenario
- No raw selectors in spec files — all selectors must come from page object LOCATORS
- No expect() calls inside page objects
- Action methods are async and return void; locator accessors are synchronous and return Locator
- Each spec test calls goto() as its first line
- No test.beforeEach used for navigation
- Code is complete and syntactically valid TypeScript

Output ONLY the final approved JSON array (corrected if needed, original if valid). No explanation, no markdown fences.`
);

export function writeTestFiles(reviewerOutput: string): Array<{ filePath: string; content: string }> {
  const jsonMatch = reviewerOutput.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Author reviewer did not return valid JSON array');
  }

  const files: Array<{ filePath: string; content: string }> = JSON.parse(jsonMatch[0]);

  for (const { filePath, content } of files) {
    const absPath = join(projectRoot, filePath);
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, content, 'utf8');
    process.stdout.write(`\n[Written] ${filePath}`);
  }
  process.stdout.write('\n');

  return files;
}
