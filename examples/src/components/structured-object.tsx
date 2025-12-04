import { createSignal, For, Show } from 'solid-js';
import { experimental_useObject } from 'ai-solid';
import { z } from 'zod';

const analysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
});

type Analysis = z.infer<typeof analysisSchema>;

export default function StructuredObject() {
  const [input, setInput] = createSignal('');

  const analyzer = experimental_useObject<Analysis, { content: string }>({
    api: '/api/analyze',
    schema: analysisSchema,
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const content = input().trim();
    if (!content) return;
    analyzer.submit({ content });
  };

  return (
    <div class="space-y-4">
      <form onSubmit={handleSubmit} class="space-y-4">
        <textarea
          value={input()}
          onInput={e => setInput(e.currentTarget.value)}
          placeholder="Enter content to analyze..."
          rows={4}
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={analyzer.isLoading}
        />

        <div class="flex gap-2">
          <Show
            when={!analyzer.isLoading}
            fallback={
              <button
                type="button"
                onClick={() => analyzer.stop()}
                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Stop
              </button>
            }
          >
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={!input().trim()}
            >
              Analyze
            </button>
          </Show>
        </div>
      </form>

      <Show when={analyzer.error}>
        <div class="bg-red-100 text-red-700 p-3 rounded">
          Error: {analyzer.error?.message}
        </div>
      </Show>

      <Show when={analyzer.object}>
        <div class="bg-gray-50 p-4 rounded-lg space-y-3">
          <Show when={analyzer.object?.title}>
            <div>
              <h3 class="text-sm font-medium text-gray-500">Title</h3>
              <p class="text-lg font-semibold">{analyzer.object?.title}</p>
            </div>
          </Show>

          <Show when={analyzer.object?.summary}>
            <div>
              <h3 class="text-sm font-medium text-gray-500">Summary</h3>
              <p>{analyzer.object?.summary}</p>
            </div>
          </Show>

          <Show when={analyzer.object?.tags?.length}>
            <div>
              <h3 class="text-sm font-medium text-gray-500">Tags</h3>
              <div class="flex flex-wrap gap-2 mt-1">
                <For each={analyzer.object?.tags}>
                  {tag => (
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {tag}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <Show when={analyzer.object?.sentiment}>
            <div>
              <h3 class="text-sm font-medium text-gray-500">Sentiment</h3>
              <span
                class={`inline-block px-2 py-1 rounded text-sm ${
                  analyzer.object?.sentiment === 'positive'
                    ? 'bg-green-100 text-green-700'
                    : analyzer.object?.sentiment === 'negative'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-200 text-gray-700'
                }`}
              >
                {analyzer.object?.sentiment}
              </span>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
