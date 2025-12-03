import {
  CompletionRequestOptions,
  UseCompletionOptions,
  callCompletionApi,
} from 'ai';
import { createSignal, createEffect, onCleanup } from 'solid-js';
import { throttle } from './throttle';

export type { UseCompletionOptions };

export type UseCompletionHelpers = {
  /** The current completion text */
  readonly completion: string;
  /** Send a new prompt to the API */
  complete: (
    prompt: string,
    options?: CompletionRequestOptions,
  ) => Promise<string | null | undefined>;
  /** The current error, if any */
  readonly error: undefined | Error;
  /** Stop the current request */
  stop: () => void;
  /** Update the completion text */
  setCompletion: (completion: string) => void;
  /** The current input value */
  readonly input: string;
  /** Set the input value */
  setInput: (value: string | ((prev: string) => string)) => void;
  /** Handle input change events */
  handleInputChange: (
    event: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement },
  ) => void;
  /** Handle form submission */
  handleSubmit: (event?: { preventDefault?: () => void }) => void;
  /** Whether a request is currently in progress */
  readonly isLoading: boolean;
};

export function useCompletion(
  options: UseCompletionOptions & {
    experimental_throttle?: number;
  } = {},
): UseCompletionHelpers {
  const {
    api = '/api/completion',
    id,
    initialCompletion = '',
    initialInput = '',
    credentials,
    headers,
    body,
    streamProtocol = 'data',
    fetch: fetchFn,
    onFinish,
    onError,
    experimental_throttle: throttleWaitMs,
  } = options;

  // Create signals for state management
  const [completion, setCompletionSignal] = createSignal<string>(initialCompletion);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<Error | undefined>(undefined);
  const [input, setInputSignal] = createSignal<string>(initialInput);
  const [abortController, setAbortController] = createSignal<AbortController | null>(null);

  // Track extra metadata that can change
  let extraMetadata = {
    credentials,
    headers,
    body,
  };

  // Update metadata when options change
  createEffect(() => {
    extraMetadata = {
      credentials,
      headers,
      body,
    };
  });

  const setCompletion = (newCompletion: string) => {
    setCompletionSignal(newCompletion);
  };

  const triggerRequest = async (
    prompt: string,
    requestOptions?: CompletionRequestOptions,
  ): Promise<string | null | undefined> => {
    return callCompletionApi({
      api,
      prompt,
      credentials: extraMetadata.credentials,
      headers: { ...extraMetadata.headers, ...requestOptions?.headers },
      body: {
        ...extraMetadata.body,
        ...requestOptions?.body,
      },
      streamProtocol,
      fetch: fetchFn,
      setCompletion: throttle(
        (newCompletion: string) => setCompletionSignal(newCompletion),
        throttleWaitMs,
      ),
      setLoading: setIsLoading,
      setError,
      setAbortController,
      onFinish,
      onError,
    });
  };

  const stop = () => {
    const controller = abortController();
    if (controller) {
      controller.abort();
      setAbortController(null);
    }
  };

  const complete = async (
    prompt: string,
    requestOptions?: CompletionRequestOptions,
  ): Promise<string | null | undefined> => {
    return triggerRequest(prompt, requestOptions);
  };

  const setInput = (value: string | ((prev: string) => string)) => {
    if (typeof value === 'function') {
      setInputSignal(prev => value(prev));
    } else {
      setInputSignal(value);
    }
  };

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    const currentInput = input();
    return currentInput ? complete(currentInput) : undefined;
  };

  const handleInputChange = (
    e: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement },
  ) => {
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
    },
  };
}
