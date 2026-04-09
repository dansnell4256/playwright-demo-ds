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
  verdict: 'pass' | 'fail' | 'flaky' | 'platform';
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
2. Whether any failures are intermittent/transient (infrastructure, timeouts, network, browser launch) vs. deterministic
3. Whether failures are consistent on a specific browser/platform but not others
4. Whether a rerun is likely to help

Respond with a JSON object (no markdown fences):
{
  "verdict": "pass" | "fail" | "flaky" | "platform",
  "shouldRerun": boolean,
  "analysis": "concise explanation of what happened and why"
}

- "pass": all tests passed
- "flaky": failures appear intermittent/transient (timeouts, network issues, browser launch failures) — a rerun may produce different results; set shouldRerun: true
- "platform": failures are consistent on one or more specific browsers (e.g. WebKit, Firefox) but pass on others — this is a deterministic browser behavioral difference, not flakiness; rerun won't help; set shouldRerun: false
- "fail": failures are consistent across all browsers due to assertion errors, missing selectors, or broken logic — rerun won't help; set shouldRerun: false

Key distinction — flaky vs platform:
- Flaky: the same test SOMETIMES passes and SOMETIMES fails (non-deterministic)
- Platform: the same test ALWAYS fails on browser X and ALWAYS passes on browser Y (deterministic, cross-browser difference)
If a test consistently fails only on WebKit or only on Firefox, classify as "platform", not "flaky".`,
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
