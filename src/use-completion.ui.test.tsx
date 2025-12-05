import {
  createTestServer,
  TestResponseController,
} from '@ai-sdk/test-server/with-vitest';
import '@testing-library/jest-dom/vitest';
import { screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { UIMessageChunk } from 'ai';
import { setupTestComponent } from './setup-test-component';
import { useCompletion } from './use-completion';
import { describe, it, expect, beforeEach } from 'vitest';

function formatChunk(part: UIMessageChunk) {
  return `data: ${JSON.stringify(part)}\n\n`;
}

const server = createTestServer({
  '/api/completion': {},
});

describe('stream data stream', () => {
  let onFinishResult: { prompt: string; completion: string } | undefined;

  setupTestComponent(() => {
    const completion = useCompletion({
      onFinish(prompt, completionText) {
        onFinishResult = { prompt, completion: completionText };
      },
    });

    return (
      <div>
        <div data-testid="loading">{completion.isLoading.toString()}</div>
        <div data-testid="error">{completion.error?.toString()}</div>
        <div data-testid="completion">{completion.completion}</div>
        <form onSubmit={completion.handleSubmit}>
          <input
            data-testid="input"
            value={completion.input}
            placeholder="Say something..."
            onInput={completion.handleInputChange}
          />
        </form>
      </div>
    );
  });

  beforeEach(() => {
    onFinishResult = undefined;
  });

  describe('render simple stream', () => {
    beforeEach(async () => {
      server.urls['/api/completion'].response = {
        type: 'stream-chunks',
        chunks: [
          formatChunk({ type: 'text-delta', id: '0', delta: 'Hello' }),
          formatChunk({ type: 'text-delta', id: '0', delta: ',' }),
          formatChunk({ type: 'text-delta', id: '0', delta: ' world' }),
          formatChunk({ type: 'text-delta', id: '0', delta: '.' }),
        ],
      };
      await userEvent.type(screen.getByTestId('input'), 'hi{enter}');
    });

    it('should render stream', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('completion')).toHaveTextContent(
          'Hello, world.',
        );
      });
    });

    it("should call 'onFinish' callback", async () => {
      await waitFor(() => {
        expect(onFinishResult).toEqual({
          prompt: 'hi',
          completion: 'Hello, world.',
        });
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state', async () => {
      const controller = new TestResponseController();

      server.urls['/api/completion'].response = {
        type: 'controlled-stream',
        controller,
      };

      await userEvent.type(screen.getByTestId('input'), 'hi{enter}');

      controller.write(
        formatChunk({ type: 'text-delta', id: '0', delta: 'Hello' }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('true');
      });

      await controller.close();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should reset loading state on error', async () => {
      server.urls['/api/completion'].response = {
        type: 'error',
        status: 404,
        body: 'Not found',
      };

      await userEvent.type(screen.getByTestId('input'), 'hi{enter}');

      await screen.findByTestId('loading');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });
});

describe('text stream', () => {
  setupTestComponent(() => {
    const completion = useCompletion({ streamProtocol: 'text' });

    return (
      <div>
        <div data-testid="completion-text-stream">{completion.completion}</div>
        <form onSubmit={completion.handleSubmit}>
          <input
            data-testid="input-text-stream"
            value={completion.input}
            placeholder="Say something..."
            onInput={completion.handleInputChange}
          />
        </form>
      </div>
    );
  });

  it('should render stream', async () => {
    server.urls['/api/completion'].response = {
      type: 'stream-chunks',
      chunks: ['Hello', ',', ' world', '.'],
    };

    await userEvent.type(screen.getByTestId('input-text-stream'), 'hi{enter}');

    await waitFor(() => {
      expect(screen.getByTestId('completion-text-stream')).toHaveTextContent(
        'Hello, world.',
      );
    });
  });
});
