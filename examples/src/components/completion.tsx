import { useCompletion } from "ai-sdk-solid";
import { Show } from "solid-js";

export default function Completion() {
  const completion = useCompletion({ api: "/api/completion" });

  return (
    <div class="space-y-4">
      <form class="space-y-4" onSubmit={completion.handleSubmit}>
        <textarea
          class="w-full resize-none rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={completion.isLoading}
          onInput={completion.handleInputChange}
          placeholder="Enter a prompt..."
          rows={4}
          value={completion.input}
        />

        <div class="flex gap-2">
          <Show
            fallback={
              <button
                class="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                onClick={() => completion.stop()}
                type="button"
              >
                Stop
              </button>
            }
            when={!completion.isLoading}
          >
            <button
              class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              disabled={!completion.input.trim()}
              type="submit"
            >
              Generate
            </button>
          </Show>
        </div>
      </form>

      <Show when={completion.error}>
        <div class="rounded bg-red-100 p-3 text-red-700">
          Error: {completion.error?.message}
        </div>
      </Show>

      <Show when={completion.completion}>
        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-2 font-medium text-gray-500 text-sm">Result:</h3>
          <p class="whitespace-pre-wrap">{completion.completion}</p>
        </div>
      </Show>
    </div>
  );
}
