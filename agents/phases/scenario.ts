import Anthropic from '@anthropic-ai/sdk';
import { streamToStdout, extractText } from '../lib/stream';
import { createReviewer } from '../lib/reviewer';

const client = new Anthropic();

export async function scenarioAgent(plan: string): Promise<string> {
  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    system: `You are an expert SDET. Given a feature plan or requirements document, identify comprehensive test scenarios.

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

  streamToStdout(stream, 'SDET: Identifying scenarios');
  return extractText(stream);
}

//see reviewer.ts for configuration of this reviewer
export const scenarioReviewerAgent = createReviewer(
  'Reviewer: Scenario deduplication',
  `You are a senior QA reviewer. Review proposed test scenarios for:
- Duplicate or near-duplicate scenarios — merge or eliminate them
- Coverage gaps: missing happy paths, edge cases, error cases, or boundary conditions
- Clarity and testability of each scenario

For each issue found, note the scenario number and the problem.
Return a final deduplicated, approved scenario list in the same numbered format.`
);
