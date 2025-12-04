import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach } from 'vitest';

export class TestResponseController {
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  private stream: ReadableStream<Uint8Array>;
  private isClosed = false;
  private isAborted = false;
  private resolveReady: (() => void) | null = null;
  private ready: Promise<void>;

  constructor() {
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });

    this.stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
        this.resolveReady?.();
      },
      cancel: () => {
        this.isAborted = true;
        this.isClosed = true;
      },
    });
  }

  async write(chunk: string): Promise<void> {
    await this.ready;
    if (this.isClosed || this.isAborted || !this.controller) {
      throw new Error('Stream is closed');
    }
    try {
      this.controller.enqueue(this.encoder.encode(chunk));
      // Give some time for the chunk to be processed
      await new Promise((resolve) => setTimeout(resolve, 5));
    } catch (error) {
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.ready;
    if (this.isClosed || this.isAborted || !this.controller) {
      throw new Error('Stream is already closed');
    }
    try {
      this.controller.close();
      this.isClosed = true;
    } catch (error) {
      throw error;
    }
  }

  getStream(): ReadableStream<Uint8Array> {
    return this.stream;
  }
}

type ResponseConfig =
  | {
      type: 'stream-chunks';
      chunks: string[];
    }
  | {
      type: 'controlled-stream';
      controller: TestResponseController;
    }
  | {
      type: 'error';
      status: number;
      body: string;
    };

interface CallInfo {
  requestBodyJson: Promise<any>;
  requestHeaders: Record<string, string>;
  requestMethod: string;
  requestUrl: string;
  requestCredentials?: RequestCredentials;
}

type UrlConfig = Record<string, { response?: ResponseConfig | ResponseConfig[] }>;

export function createTestServer(urlConfig: UrlConfig) {
  const calls: CallInfo[] = [];
  const responseIndices: Record<string, number> = {};

  const urls: Record<string, { response?: ResponseConfig | ResponseConfig[] }> = {};

  // Initialize urls object
  for (const path of Object.keys(urlConfig)) {
    urls[path] = { response: urlConfig[path].response };
  }

  const handlers = Object.keys(urlConfig).flatMap((path) => {
    const fullUrl = `http://localhost:3000${path}`;

    return [
      http.get(fullUrl, async ({ request }) => {
        const config = urls[path];
        let response = config.response;

        if (Array.isArray(response)) {
          const idx = responseIndices[path] || 0;
          response = response[idx];
          responseIndices[path] = idx + 1;
        }

        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
          if (key !== 'host' && key !== 'connection' && key !== 'accept' &&
              key !== 'accept-language' && key !== 'accept-encoding' &&
              key !== 'user-agent' && key !== 'sec-fetch-dest' &&
              key !== 'sec-fetch-mode' && key !== 'sec-fetch-site') {
            headers[key] = value;
          }
        });

        calls.push({
          requestBodyJson: Promise.resolve(null),
          requestHeaders: headers,
          requestMethod: 'GET',
          requestUrl: request.url,
        });

        if (!response) {
          return new HttpResponse(null, { status: 404 });
        }

        if (response.type === 'error') {
          return new HttpResponse(response.body, { status: response.status });
        }

        if (response.type === 'stream-chunks') {
          const chunks = response.chunks;
          const stream = new ReadableStream({
            async start(controller) {
              for (const chunk of chunks) {
                controller.enqueue(new TextEncoder().encode(chunk));
                await new Promise((resolve) => setTimeout(resolve, 10));
              }
              controller.close();
            },
          });
          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        }

        if (response.type === 'controlled-stream') {
          return new HttpResponse(response.controller.getStream(), {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        }

        return new HttpResponse(null, { status: 500 });
      }),
      http.post(fullUrl, async ({ request }) => {
        const config = urls[path];
        let response = config.response;

        if (Array.isArray(response)) {
          const idx = responseIndices[path] || 0;
          response = response[idx];
          responseIndices[path] = idx + 1;
        }

        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
          if (key !== 'host' && key !== 'connection' && key !== 'accept' &&
              key !== 'accept-language' && key !== 'accept-encoding' &&
              key !== 'user-agent' && key !== 'sec-fetch-dest' &&
              key !== 'sec-fetch-mode' && key !== 'sec-fetch-site') {
            headers[key] = value;
          }
        });

        const bodyText = await request.text();
        let requestBodyJson: any;
        try {
          requestBodyJson = JSON.parse(bodyText);
        } catch {
          requestBodyJson = bodyText;
        }

        calls.push({
          requestBodyJson: Promise.resolve(requestBodyJson),
          requestHeaders: headers,
          requestMethod: 'POST',
          requestUrl: request.url,
          requestCredentials: request.credentials,
        });

        if (!response) {
          return new HttpResponse(null, { status: 404 });
        }

        if (response.type === 'error') {
          return new HttpResponse(response.body, { status: response.status });
        }

        if (response.type === 'stream-chunks') {
          const chunks = response.chunks;
          const stream = new ReadableStream({
            async start(controller) {
              for (const chunk of chunks) {
                controller.enqueue(new TextEncoder().encode(chunk));
                await new Promise((resolve) => setTimeout(resolve, 10));
              }
              controller.close();
            },
          });
          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        }

        if (response.type === 'controlled-stream') {
          return new HttpResponse(response.controller.getStream(), {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        }

        return new HttpResponse(null, { status: 500 });
      }),
    ];
  });

  const server = setupServer(...handlers);

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    calls.length = 0;
    Object.keys(responseIndices).forEach((key) => {
      responseIndices[key] = 0;
    });
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  return {
    urls,
    calls,
    server,
  };
}

// Mock for provider-utils test helper
export function mockId() {
  let counter = 0;
  return () => `id-${counter++}`;
}
