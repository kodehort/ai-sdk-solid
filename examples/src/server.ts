import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {   convertToModelMessages,
createUIMessageStreamResponse,
streamText,
streamObject,
validateUIMessages,
type ModelMessage,
type UIMessage,
 } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const app = new Hono();

app.use('/*', cors());


app.post('/api/chat', async (req: Request): Promise<Response> => {
  const body = await req.json();

  let messages: UIMessage[];

  try {
    messages = await validateUIMessages({
      messages: body.messages,
    });
  } catch (error) {
    return new Response('Invalid messages', { status: 400 });
  }

  const modelMessages: ModelMessage[] =
    convertToModelMessages(messages);

  const streamTextResult = streamText({
    model: anthropic('claude-3-5-haiku-latest'),
    messages: modelMessages
  });

  const stream = streamTextResult.toUIMessageStream();

  return createUIMessageStreamResponse({
    stream,
  });
});

app.post('/api/completion', async c => {
  const { prompt } = await c.req.json();

  const result = streamText({
    model: anthropic('claude-3-5-haiku-latest'),
    prompt,
  });

  return result.toTextStreamResponse();
});

const analysisSchema = z.object({
  title: z.string().describe('A short title for the content'),
  summary: z.string().describe('A brief summary of the content'),
  tags: z.array(z.string()).describe('Relevant tags for the content'),
  sentiment: z.enum(['positive', 'negative', 'neutral']).describe('Overall sentiment'),
});

app.post('/api/analyze', async c => {
  const { content } = await c.req.json();

  const result = streamObject({
    model: anthropic('claude-3-5-haiku-latest'),
    schema: analysisSchema,
    prompt: `Analyze the following content and extract structured information:\n\n${content}`,
  });

  return result.toTextStreamResponse();
});

serve({ fetch: app.fetch, port: 3000 }, info => {
  console.log(`Server running at http://localhost:${info.port}`);
});
