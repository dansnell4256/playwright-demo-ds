import Anthropic from '@anthropic-ai/sdk';
import { streamToStdout, extractText } from './stream';

const client = new Anthropic();

export function createReviewer(label: string, systemPrompt: string) {
  return async (content: string, context?: string): Promise<string> => {
    const userContent = context
      ? `Context:\n\n${context}\n\n---\n\nContent to review:\n\n${content}`
      : `Content to review:\n\n${content}`;

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    streamToStdout(stream, label);
    return extractText(stream);
  };
}
