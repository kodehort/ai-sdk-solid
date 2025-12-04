import {
  AbstractChat,
  ChatInit,
  type CreateUIMessage,
  type UIMessage,
} from 'ai';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { Chat } from './chat.solid';

export type { CreateUIMessage, UIMessage };

export type UseChatHelpers<UI_MESSAGE extends UIMessage> = {
  /**
   * The id of the chat.
   */
  readonly id: string;

  /**
   * The current messages in the chat.
   */
  readonly messages: UI_MESSAGE[];

  /**
   * Update the `messages` state locally. This is useful when you want to
   * edit the messages on the client, and then trigger the `reload` method
   * manually to regenerate the AI response.
   */
  setMessages: (
    messages: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) => void;

  /**
   * The current error, if any.
   */
  readonly error: Error | undefined;

  /**
   * The current status of the chat.
   */
  readonly status: AbstractChat<UI_MESSAGE>['status'];

  /**
   * Send a message to the chat.
   */
  sendMessage: AbstractChat<UI_MESSAGE>['sendMessage'];

  /**
   * Regenerate the last assistant message.
   */
  regenerate: AbstractChat<UI_MESSAGE>['regenerate'];

  /**
   * Stop the current streaming response.
   */
  stop: AbstractChat<UI_MESSAGE>['stop'];

  /**
   * Resume an interrupted stream.
   */
  resumeStream: AbstractChat<UI_MESSAGE>['resumeStream'];

  /**
   * Clear the current error.
   */
  clearError: AbstractChat<UI_MESSAGE>['clearError'];

  /**
   * Add a tool result to the chat.
   * @deprecated Use `addToolOutput` instead.
   */
  addToolResult: AbstractChat<UI_MESSAGE>['addToolOutput'];

  /**
   * Add a tool output to the chat.
   */
  addToolOutput: AbstractChat<UI_MESSAGE>['addToolOutput'];
};

export type UseChatOptions<UI_MESSAGE extends UIMessage> = (
  | { chat: Chat<UI_MESSAGE> }
  | ChatInit<UI_MESSAGE>
) & {
  /**
   * Custom throttle wait in ms for the chat messages and data updates.
   * Default is undefined, which disables throttling.
   */
  experimental_throttle?: number;

  /**
   * Whether to resume an ongoing chat generation stream.
   */
  resume?: boolean;
};

export function useChat<UI_MESSAGE extends UIMessage = UIMessage>(
  options: UseChatOptions<UI_MESSAGE> = {},
): UseChatHelpers<UI_MESSAGE> {
  const { experimental_throttle: throttleWaitMs, resume = false, ...rest } = options;

  // Create the chat instance
  const getInitialChat = (): Chat<UI_MESSAGE> => {
    if ('chat' in rest) {
      return rest.chat;
    }
    return new Chat(rest);
  };

  let chatInstance = getInitialChat();

  // Track options for recreation
  const getOptionsId = () => ('id' in rest ? rest.id : null);
  let lastOptionsId = getOptionsId();
  let lastChatRef = 'chat' in rest ? rest.chat : null;

  // Create signals for reactive state
  const [messages, setMessagesSignal] = createSignal<UI_MESSAGE[]>(
    chatInstance.messages,
  );
  const [status, setStatus] = createSignal<AbstractChat<UI_MESSAGE>['status']>(
    chatInstance.status,
  );
  const [error, setError] = createSignal<Error | undefined>(chatInstance.error);

  // Function to get current chat (handles recreation)
  const getChat = (): Chat<UI_MESSAGE> => {
    const currentOptionsId = getOptionsId();
    const currentChatRef = 'chat' in rest ? rest.chat : null;

    const shouldRecreate =
      (currentChatRef !== null && currentChatRef !== lastChatRef) ||
      (currentOptionsId !== null && currentOptionsId !== lastOptionsId);

    if (shouldRecreate) {
      chatInstance = getInitialChat();
      lastOptionsId = currentOptionsId;
      lastChatRef = currentChatRef;

      // Update signals with new chat state
      setMessagesSignal(chatInstance.messages);
      setStatus(chatInstance.status);
      setError(chatInstance.error);
    }

    return chatInstance;
  };

  // Set up subscriptions
  onMount(() => {
    const chat = getChat();

    // Subscribe to messages changes
    const unsubscribeMessages = chat['~registerMessagesCallback'](() => {
      setMessagesSignal([...chat.messages]);
    }, throttleWaitMs);

    // Subscribe to status changes
    const unsubscribeStatus = chat['~registerStatusCallback'](() => {
      setStatus(chat.status);
    });

    // Subscribe to error changes
    const unsubscribeError = chat['~registerErrorCallback'](() => {
      setError(chat.error);
    });

    onCleanup(() => {
      unsubscribeMessages();
      unsubscribeStatus();
      unsubscribeError();
    });
  });

  // Handle resume option
  createEffect(() => {
    if (resume) {
      getChat().resumeStream();
    }
  });

  // setMessages function
  const setMessages = (
    messagesParam: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) => {
    const chat = getChat();
    if (typeof messagesParam === 'function') {
      messagesParam = messagesParam(chat.messages);
    }
    chat.messages = messagesParam;
  };

  return {
    get id() {
      return getChat().id;
    },
    get messages() {
      // Trigger reactivity check for chat recreation
      getChat();
      return messages();
    },
    setMessages,
    get sendMessage() {
      return getChat().sendMessage;
    },
    get regenerate() {
      return getChat().regenerate;
    },
    get clearError() {
      return getChat().clearError;
    },
    get stop() {
      const chat = getChat();
      return async () => {
        await chat.stop();
        // Force status to 'ready' for immediate UI update
        // AbstractChat.stop() aborts the stream but callback may not fire reliably
        setStatus('ready');
      };
    },
    get error() {
      // Trigger reactivity check for chat recreation
      getChat();
      return error();
    },
    get resumeStream() {
      return getChat().resumeStream;
    },
    get status() {
      // Trigger reactivity check for chat recreation
      getChat();
      return status();
    },
    /**
     * @deprecated Use `addToolOutput` instead.
     */
    get addToolResult() {
      return getChat().addToolOutput;
    },
    get addToolOutput() {
      return getChat().addToolOutput;
    },
  };
}
