import { Show } from 'solid-js';
import { useCompletion } from 'ai-sdk-solid';

export default function Completion() {
  const completion = useCompletion({ api: '/api/completion' });

  return (
    <div class="space-y-4">
      <form onSubmit={completion.handleSubmit} class="space-y-4">
        <textarea
          value={completion.input}
          onInput={completion.handleInputChange}
          placeholder="Enter a prompt..."
          rows={4}
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={completion.isLoading}
        />

        <div class="flex gap-2">
          <Show
            when={!completion.isLoading}
            fallback={
              <button
                type="button"
                onClick={() => completion.stop()}
                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Stop
              </button>
            }
          >
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={!completion.input.trim()}
            >
              Generate
            </button>
          </Show>
        </div>
      </form>

      <Show when={completion.error}>
        <div class="bg-red-100 text-red-700 p-3 rounded">
          Error: {completion.error?.message}
        </div>
      </Show>

      <Show when={completion.completion}>
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Result:</h3>
          <p class="whitespace-pre-wrap">{completion.completion}</p>
        </div>
      </Show>
    </div>
  );
}
