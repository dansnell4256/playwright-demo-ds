import Anthropic from '@anthropic-ai/sdk';

type MessageStream = ReturnType<Anthropic['messages']['stream']>;

export function streamToStdout(stream: MessageStream, label: string): void {
  process.stdout.write(`\n[${label}]\n\n`);
  stream.on('text', (text) => process.stdout.write(text));
}

export async function extractText(stream: MessageStream): Promise<string> {
  const message = await stream.finalMessage();
  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return textBlock?.text ?? '';
}
