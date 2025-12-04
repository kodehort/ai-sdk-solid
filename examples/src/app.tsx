import { createSignal, Match, Switch } from 'solid-js';
import Chat from './components/chat';
import Completion from './components/completion';
import StructuredObject from './components/structured-object';

type Tab = 'chat' | 'completion' | 'object';

export default function App() {
  const [activeTab, setActiveTab] = createSignal<Tab>('chat');

  const tabClass = (tab: Tab) =>
    `px-4 py-2 font-medium rounded-t-lg ${
      activeTab() === tab
        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div class="min-h-screen bg-gray-100 p-4">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-2xl font-bold mb-4">AI SDK Solid Examples</h1>

        <div class="flex gap-2 mb-4">
          <button class={tabClass('chat')} onClick={() => setActiveTab('chat')}>
            Chat
          </button>
          <button class={tabClass('completion')} onClick={() => setActiveTab('completion')}>
            Completion
          </button>
          <button class={tabClass('object')} onClick={() => setActiveTab('object')}>
            Structured Object
          </button>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <Switch>
            <Match when={activeTab() === 'chat'}>
              <Chat />
            </Match>
            <Match when={activeTab() === 'completion'}>
              <Completion />
            </Match>
            <Match when={activeTab() === 'object'}>
              <StructuredObject />
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
}
