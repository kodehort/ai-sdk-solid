import { useObject } from "ai-sdk-solid";
import { createSignal, For, Show } from "solid-js";
import { z } from "zod";

const analysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  sentiment: z.enum(["positive", "negative", "neutral"]),
});

type Analysis = z.infer<typeof analysisSchema>;

const getSentimentClass = (sentiment: string | undefined) => {
  if (sentiment === "positive") {
    return "bg-green-100 text-green-700";
  }
  if (sentiment === "negative") {
    return "bg-red-100 text-red-700";
  }
  return "bg-gray-200 text-gray-700";
};

export default function StructuredObject() {
  const [input, setInput] = createSignal("");

  const analyzer = useObject<Analysis, { content: string }>({
    api: "/api/analyze",
    schema: analysisSchema,
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const content = input().trim();
    if (!content) {
      return;
    }
    analyzer.submit({ content });
  };

  return (
    <div class="space-y-4">
      <form class="space-y-4" onSubmit={handleSubmit}>
        <textarea
          class="w-full resize-none rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={analyzer.isLoading}
          onInput={(e) => setInput(e.currentTarget.value)}
          placeholder="Enter content to analyze..."
          rows={4}
          value={input()}
        />

        <div class="flex gap-2">
          <Show
            fallback={
              <button
                class="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                onClick={() => analyzer.stop()}
                type="button"
              >
                Stop
              </button>
            }
            when={!analyzer.isLoading}
          >
            <button
              class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              disabled={!input().trim()}
              type="submit"
            >
              Analyze
            </button>
          </Show>
        </div>
      </form>

      <Show when={analyzer.error}>
        <div class="rounded bg-red-100 p-3 text-red-700">
          Error: {analyzer.error?.message}
        </div>
      </Show>

      <Show when={analyzer.object}>
        <div class="space-y-3 rounded-lg bg-gray-50 p-4">
          <Show when={analyzer.object?.title}>
            <div>
              <h3 class="font-medium text-gray-500 text-sm">Title</h3>
              <p class="font-semibold text-lg">{analyzer.object?.title}</p>
            </div>
          </Show>

          <Show when={analyzer.object?.summary}>
            <div>
              <h3 class="font-medium text-gray-500 text-sm">Summary</h3>
              <p>{analyzer.object?.summary}</p>
            </div>
          </Show>

          <Show when={analyzer.object?.tags?.length}>
            <div>
              <h3 class="font-medium text-gray-500 text-sm">Tags</h3>
              <div class="mt-1 flex flex-wrap gap-2">
                <For each={analyzer.object?.tags}>
                  {(tag) => (
                    <span class="rounded bg-blue-100 px-2 py-1 text-blue-700 text-sm">
                      {tag}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <Show when={analyzer.object?.sentiment}>
            <div>
              <h3 class="font-medium text-gray-500 text-sm">Sentiment</h3>
              <span
                class={`inline-block rounded px-2 py-1 text-sm ${getSentimentClass(analyzer.object?.sentiment)}`}
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
