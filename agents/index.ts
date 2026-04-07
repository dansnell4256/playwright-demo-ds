import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Anthropic();

export async function sdетAgent(plan: string): Promise<string> {
  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    system: `You are an expert SDET (Software Development Engineer in Test).
Given a feature plan or requirements document, identify comprehensive test scenarios.

For each scenario include:
- Test scenario name
- What is being tested
- Test type: happy path, edge case, error case, or boundary condition
- Key assertions to verify

Format output as a numbered list of clearly defined scenarios.`,
    messages: [
      { role: 'user', content: `Identify test scenarios for the following plan:\n\n${plan}` },
    ],
  });

  process.stdout.write('\n[SDET] Identifying test scenarios...\n\n');
  stream.on('text', (text) => process.stdout.write(text));

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return textBlock?.text ?? '';
}

export async function reviewerAgent(scenarios: string): Promise<string> {
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 64000,
    system: `You are a senior QA reviewer. Review proposed test scenarios for:
- Coverage completeness: are all features and flows represented?
- Missing edge cases or boundary conditions
- Missing negative/error scenarios
- Redundancy or overlap between scenarios
- Clarity and testability

Provide specific feedback per scenario and a final approved list with any additions.`,
    messages: [
      { role: 'user', content: `Review these test scenarios:\n\n${scenarios}` },
    ],
  });

  process.stdout.write('\n\n[Reviewer] Reviewing scenarios...\n\n');
  stream.on('text', (text) => process.stdout.write(text));

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return textBlock?.text ?? '';
}

export async function runPipeline(plan: string): Promise<{ scenarios: string; review: string }> {
  const scenarios = await sdетAgent(plan);
  const review = await reviewerAgent(scenarios);

  const outputDir = join(__dirname, 'output');
  mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = join(outputDir, `scenarios-${timestamp}.md`);

  writeFileSync(outputPath, [
    '# Test Scenarios',
    '',
    '## Plan',
    plan.trim(),
    '',
    '## SDET: Identified Scenarios',
    scenarios,
    '',
    '## Reviewer: Feedback & Approved List',
    review,
  ].join('\n'));

  process.stdout.write(`\n\n[Saved] ${outputPath}\n`);
  return { scenarios, review };
}

// Run directly: npx tsx agents/index.ts
const examplePlan = `
Feature: Todo list management
- Users can add a todo item by typing in an input field and pressing Enter
- Users can mark a todo item as complete by clicking a checkbox
- Users can filter todos by: All, Active, Completed
- Users can delete a todo item
- The footer shows the count of remaining active items
`;

runPipeline(examplePlan).then(() => {
  process.stdout.write('\n\n[Pipeline complete]\n');
});
