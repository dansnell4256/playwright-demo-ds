import Anthropic from '@anthropic-ai/sdk';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { streamToStdout, extractText } from '../lib/stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

const client = new Anthropic();

export interface ExecutionResult {
  passed: number;
  failed: number;
  output: string;
}

export interface VerificationResult {
  verdict: 'pass' | 'fail' | 'flaky';
  shouldRerun: boolean;
  analysis: string;
}

export async function testExecutorAgent(): Promise<ExecutionResult> {
  process.stdout.write('\n[Executor] Running playwright tests...\n\n');

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];

    const proc = spawn('npx', ['playwright', 'test', '--reporter=list'], {
      cwd: projectRoot,
      env: { ...process.env },
    });

    proc.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      process.stdout.write(chunk);
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      process.stderr.write(chunk);
    });

    proc.on('close', () => {
      const output = Buffer.concat(chunks).toString('utf8');
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);

      resolve({
        passed: passedMatch ? parseInt(passedMatch[1], 10) : 0,
        failed: failedMatch ? parseInt(failedMatch[1], 10) : 0,
        output,
      });
    });
  });
}

export async function verifierAgent(execution: ExecutionResult): Promise<VerificationResult> {
  process.stdout.write('\n[Verifier] Analyzing test results...\n\n');

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are a test verification agent. Analyze Playwright test execution output and determine:
1. Whether the tests genuinely pass or fail
2. Whether any failures look like infrastructure/flakiness issues (timeouts, network, browser launch) vs real assertion failures
3. Whether a rerun is likely to help

Respond with a JSON object (no markdown fences):
{
  "verdict": "pass" | "fail" | "flaky",
  "shouldRerun": boolean,
  "analysis": "concise explanation of what happened and why"
}

- "pass": all tests passed
- "flaky": some tests failed but failures appear to be environmental/transient — recommend rerun
- "fail": tests failed due to real assertion errors or missing selectors — rerun won't help`,
    messages: [
      {
        role: 'user',
        content: `Test run results:\n- Passed: ${execution.passed}\n- Failed: ${execution.failed}\n\nFull output:\n\`\`\`\n${execution.output}\n\`\`\``,
      },
    ],
  });

  streamToStdout(stream, 'Verifier: Assessing results');
  const raw = await extractText(stream);

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { verdict: 'fail', shouldRerun: false, analysis: raw };
  }

  return JSON.parse(jsonMatch[0]) as VerificationResult;
}
