import { createSignal, For, Show } from 'solid-js';
import { useChat } from 'ai-sdk-solid';

export default function Chat() {
  const [input, setInput] = createSignal('');
  const chat = useChat();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const content = input().trim();
    if (!content) return;

    setInput('');
    await chat.sendMessage({ text: content });
  };

  return (
    <div class="flex flex-col h-[500px]">
      <div class="flex-1 overflow-y-auto space-y-4 mb-4">
        <Show when={chat.messages.length === 0}>
          <p class="text-gray-500 text-center py-8">Send a message to start</p>
        </Show>

        <For each={chat.messages}>
          {message => (
            <div
              class={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-8'
                  : 'bg-gray-100 mr-8'
              }`}
            >
              <div class="text-xs text-gray-500 mb-1">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <For each={message.parts}>
                {part => (
                  <Show when={part.type === 'text'}>
                    <p class="whitespace-pre-wrap">{(part as { type: 'text'; text: string }).text}</p>
                  </Show>
                )}
              </For>
            </div>
          )}
        </For>

        <Show when={chat.status === 'streaming'}>
          <div class="text-gray-500 animate-pulse">Typing...</div>
        </Show>
      </div>

      <Show when={chat.error}>
        <div class="bg-red-100 text-red-700 p-3 rounded mb-4">
          Error: {chat.error?.message}
        </div>
      </Show>

      <form onSubmit={handleSubmit} class="flex gap-2">
        <input
          type="text"
          value={input()}
          onInput={e => setInput(e.currentTarget.value)}
          placeholder="Type a message..."
          class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={chat.status === 'streaming'}
        />
        <Show
          when={chat.status !== 'streaming'}
          fallback={
            <button
              type="button"
              onClick={() => chat.stop()}
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
            Send
          </button>
        </Show>
      </form>
    </div>
  );
}
