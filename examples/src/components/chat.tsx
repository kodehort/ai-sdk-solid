import { useChat } from "ai-sdk-solid";
import { createSignal, For, Show } from "solid-js";

export default function Chat() {
  const [input, setInput] = createSignal("");
  const chat = useChat();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const content = input().trim();
    if (!content) {
      return;
    }

    setInput("");
    await chat.sendMessage({ text: content });
  };

  return (
    <div class="flex h-[500px] flex-col">
      <div class="mb-4 flex-1 space-y-4 overflow-y-auto">
        <Show when={chat.messages.length === 0}>
          <p class="py-8 text-center text-gray-500">Send a message to start</p>
        </Show>

        <For each={chat.messages}>
          {(message) => (
            <div
              class={`rounded-lg p-3 ${
                message.role === "user"
                  ? "ml-8 bg-blue-100"
                  : "mr-8 bg-gray-100"
              }`}
            >
              <div class="mb-1 text-gray-500 text-xs">
                {message.role === "user" ? "You" : "Assistant"}
              </div>
              <For each={message.parts}>
                {(part) => (
                  <Show when={part.type === "text"}>
                    <p class="whitespace-pre-wrap">
                      {(part as { type: "text"; text: string }).text}
                    </p>
                  </Show>
                )}
              </For>
            </div>
          )}
        </For>

        <Show when={chat.status === "streaming"}>
          <div class="animate-pulse text-gray-500">Typing...</div>
        </Show>
      </div>

      <Show when={chat.error}>
        <div class="mb-4 rounded bg-red-100 p-3 text-red-700">
          Error: {chat.error?.message}
        </div>
      </Show>

      <form class="flex gap-2" onSubmit={handleSubmit}>
        <input
          class="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={chat.status === "streaming"}
          onInput={(e) => setInput(e.currentTarget.value)}
          placeholder="Type a message..."
          type="text"
          value={input()}
        />
        <Show
          fallback={
            <button
              class="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              onClick={() => chat.stop()}
              type="button"
            >
              Stop
            </button>
          }
          when={chat.status !== "streaming"}
        >
          <button
            class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={!input().trim()}
            type="submit"
          >
            Send
          </button>
        </Show>
      </form>
    </div>
  );
}
