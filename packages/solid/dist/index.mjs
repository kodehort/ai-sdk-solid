import { createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { AbstractChat, asSchema, parsePartialJson, isDeepEqualData, callCompletionApi } from 'ai';
import throttleFunction from 'throttleit';
import { safeValidateTypes, isAbortError } from '@ai-sdk/provider-utils';

// src/use-chat.ts
function throttle(fn, waitMs) {
  return waitMs != null ? throttleFunction(fn, waitMs) : fn;
}

// src/chat.solid.ts
var SolidChatState = class {
  constructor(initialMessages = []) {
    this.#status = "ready";
    this.#error = void 0;
    this.#messagesCallbacks = /* @__PURE__ */ new Set();
    this.#statusCallbacks = /* @__PURE__ */ new Set();
    this.#errorCallbacks = /* @__PURE__ */ new Set();
    this.pushMessage = (message) => {
      this.#messages = this.#messages.concat(message);
      this.#callMessagesCallbacks();
    };
    this.popMessage = () => {
      this.#messages = this.#messages.slice(0, -1);
      this.#callMessagesCallbacks();
    };
    this.replaceMessage = (index, message) => {
      this.#messages = [
        ...this.#messages.slice(0, index),
        this.snapshot(message),
        ...this.#messages.slice(index + 1)
      ];
      this.#callMessagesCallbacks();
    };
    this.snapshot = (value) => structuredClone(value);
    this["~registerMessagesCallback"] = (onChange, throttleWaitMs) => {
      const callback = throttleWaitMs ? throttle(onChange, throttleWaitMs) : onChange;
      this.#messagesCallbacks.add(callback);
      return () => {
        this.#messagesCallbacks.delete(callback);
      };
    };
    this["~registerStatusCallback"] = (onChange) => {
      this.#statusCallbacks.add(onChange);
      return () => {
        this.#statusCallbacks.delete(onChange);
      };
    };
    this["~registerErrorCallback"] = (onChange) => {
      this.#errorCallbacks.add(onChange);
      return () => {
        this.#errorCallbacks.delete(onChange);
      };
    };
    this.#callMessagesCallbacks = () => {
      this.#messagesCallbacks.forEach((callback) => callback());
    };
    this.#callStatusCallbacks = () => {
      this.#statusCallbacks.forEach((callback) => callback());
    };
    this.#callErrorCallbacks = () => {
      this.#errorCallbacks.forEach((callback) => callback());
    };
    this.#messages = initialMessages;
  }
  #messages;
  #status;
  #error;
  #messagesCallbacks;
  #statusCallbacks;
  #errorCallbacks;
  get status() {
    return this.#status;
  }
  set status(newStatus) {
    this.#status = newStatus;
    this.#callStatusCallbacks();
  }
  get error() {
    return this.#error;
  }
  set error(newError) {
    this.#error = newError;
    this.#callErrorCallbacks();
  }
  get messages() {
    return this.#messages;
  }
  set messages(newMessages) {
    this.#messages = [...newMessages];
    this.#callMessagesCallbacks();
  }
  #callMessagesCallbacks;
  #callStatusCallbacks;
  #callErrorCallbacks;
};
var Chat = class extends AbstractChat {
  constructor({ messages, ...init }) {
    const state = new SolidChatState(messages);
    super({ ...init, state });
    this["~registerMessagesCallback"] = (onChange, throttleWaitMs) => this.#state["~registerMessagesCallback"](onChange, throttleWaitMs);
    this["~registerStatusCallback"] = (onChange) => this.#state["~registerStatusCallback"](onChange);
    this["~registerErrorCallback"] = (onChange) => this.#state["~registerErrorCallback"](onChange);
    this.#state = state;
  }
  #state;
};

// src/use-chat.ts
function useChat(options = {}) {
  const { experimental_throttle: throttleWaitMs, resume = false, ...rest } = options;
  const getInitialChat = () => {
    if ("chat" in rest) {
      return rest.chat;
    }
    return new Chat(rest);
  };
  let chatInstance = getInitialChat();
  const getOptionsId = () => "id" in rest ? rest.id : null;
  let lastOptionsId = getOptionsId();
  let lastChatRef = "chat" in rest ? rest.chat : null;
  const [messages, setMessagesSignal] = createSignal(
    chatInstance.messages
  );
  const [status, setStatus] = createSignal(
    chatInstance.status
  );
  const [error, setError] = createSignal(chatInstance.error);
  const getChat = () => {
    const currentOptionsId = getOptionsId();
    const currentChatRef = "chat" in rest ? rest.chat : null;
    const shouldRecreate = currentChatRef !== null && currentChatRef !== lastChatRef || currentOptionsId !== null && currentOptionsId !== lastOptionsId;
    if (shouldRecreate) {
      chatInstance = getInitialChat();
      lastOptionsId = currentOptionsId;
      lastChatRef = currentChatRef;
      setMessagesSignal(chatInstance.messages);
      setStatus(chatInstance.status);
      setError(chatInstance.error);
    }
    return chatInstance;
  };
  onMount(() => {
    const chat = getChat();
    const unsubscribeMessages = chat["~registerMessagesCallback"](() => {
      setMessagesSignal([...chat.messages]);
    }, throttleWaitMs);
    const unsubscribeStatus = chat["~registerStatusCallback"](() => {
      setStatus(chat.status);
    });
    const unsubscribeError = chat["~registerErrorCallback"](() => {
      setError(chat.error);
    });
    onCleanup(() => {
      unsubscribeMessages();
      unsubscribeStatus();
      unsubscribeError();
    });
  });
  createEffect(() => {
    if (resume) {
      getChat().resumeStream();
    }
  });
  const setMessages = (messagesParam) => {
    const chat = getChat();
    if (typeof messagesParam === "function") {
      messagesParam = messagesParam(chat.messages);
    }
    chat.messages = messagesParam;
  };
  return {
    get id() {
      return getChat().id;
    },
    get messages() {
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
      return getChat().stop;
    },
    get error() {
      getChat();
      return error();
    },
    get resumeStream() {
      return getChat().resumeStream;
    },
    get status() {
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
    }
  };
}
function useCompletion(options = {}) {
  const {
    api = "/api/completion",
    id,
    initialCompletion = "",
    initialInput = "",
    credentials,
    headers,
    body,
    streamProtocol = "data",
    fetch: fetchFn,
    onFinish,
    onError,
    experimental_throttle: throttleWaitMs
  } = options;
  const [completion, setCompletionSignal] = createSignal(initialCompletion);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal(void 0);
  const [input, setInputSignal] = createSignal(initialInput);
  const [abortController, setAbortController] = createSignal(null);
  let extraMetadata = {
    credentials,
    headers,
    body
  };
  createEffect(() => {
    extraMetadata = {
      credentials,
      headers,
      body
    };
  });
  const setCompletion = (newCompletion) => {
    setCompletionSignal(newCompletion);
  };
  const triggerRequest = async (prompt, requestOptions) => {
    return callCompletionApi({
      api,
      prompt,
      credentials: extraMetadata.credentials,
      headers: { ...extraMetadata.headers, ...requestOptions?.headers },
      body: {
        ...extraMetadata.body,
        ...requestOptions?.body
      },
      streamProtocol,
      fetch: fetchFn,
      setCompletion: throttle(
        (newCompletion) => setCompletionSignal(newCompletion),
        throttleWaitMs
      ),
      setLoading: setIsLoading,
      setError,
      setAbortController,
      onFinish,
      onError
    });
  };
  const stop = () => {
    const controller = abortController();
    if (controller) {
      controller.abort();
      setAbortController(null);
    }
  };
  const complete = async (prompt, requestOptions) => {
    return triggerRequest(prompt, requestOptions);
  };
  const setInput = (value) => {
    if (typeof value === "function") {
      setInputSignal((prev) => value(prev));
    } else {
      setInputSignal(value);
    }
  };
  const handleSubmit = (event) => {
    event?.preventDefault?.();
    const currentInput = input();
    return currentInput ? complete(currentInput) : void 0;
  };
  const handleInputChange = (e) => {
    setInputSignal(e.currentTarget.value);
  };
  return {
    get completion() {
      return completion();
    },
    complete,
    get error() {
      return error();
    },
    setCompletion,
    stop,
    get input() {
      return input();
    },
    setInput,
    handleInputChange,
    handleSubmit,
    get isLoading() {
      return isLoading();
    }
  };
}
var getOriginalFetch = () => fetch;
function useObject({
  api,
  id,
  schema,
  initialValue,
  fetch: fetchFn,
  onError,
  onFinish,
  headers,
  credentials
}) {
  const [object, setObject] = createSignal(
    initialValue
  );
  const [error, setError] = createSignal(void 0);
  const [isLoading, setIsLoading] = createSignal(false);
  let abortControllerRef = null;
  const stop = () => {
    try {
      abortControllerRef?.abort();
    } catch (ignored) {
    } finally {
      setIsLoading(false);
      abortControllerRef = null;
    }
  };
  const clearObject = () => {
    setError(void 0);
    setIsLoading(false);
    setObject(void 0);
  };
  const clear = () => {
    stop();
    clearObject();
  };
  const submit = async (input) => {
    try {
      clearObject();
      setIsLoading(true);
      const abortController = new AbortController();
      abortControllerRef = abortController;
      const actualFetch = fetchFn ?? getOriginalFetch();
      const response = await actualFetch(api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers
        },
        credentials,
        signal: abortController.signal,
        body: JSON.stringify(input)
      });
      if (!response.ok) {
        throw new Error(
          await response.text() ?? "Failed to fetch the response."
        );
      }
      if (response.body == null) {
        throw new Error("The response body is empty.");
      }
      let accumulatedText = "";
      let latestObject = void 0;
      await response.body.pipeThrough(new TextDecoderStream()).pipeTo(
        new WritableStream({
          async write(chunk) {
            accumulatedText += chunk;
            const { value } = await parsePartialJson(accumulatedText);
            const currentObject = value;
            if (!isDeepEqualData(latestObject, currentObject)) {
              latestObject = currentObject;
              setObject(() => currentObject);
            }
          },
          async close() {
            setIsLoading(false);
            abortControllerRef = null;
            if (onFinish != null) {
              const validationResult = await safeValidateTypes({
                value: latestObject,
                schema: asSchema(schema)
              });
              onFinish(
                validationResult.success ? { object: validationResult.value, error: void 0 } : { object: void 0, error: validationResult.error }
              );
            }
          }
        })
      );
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      if (onError && err instanceof Error) {
        onError(err);
      }
      setIsLoading(false);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };
  return {
    submit,
    get object() {
      return object();
    },
    get error() {
      return error();
    },
    get isLoading() {
      return isLoading();
    },
    stop,
    clear
  };
}
var experimental_useObject = useObject;

export { Chat, experimental_useObject, useChat, useCompletion };
