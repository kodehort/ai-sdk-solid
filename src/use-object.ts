import {
  FetchFunction,
  isAbortError,
  safeValidateTypes,
} from '@ai-sdk/provider-utils';
import { asSchema, DeepPartial, isDeepEqualData, parsePartialJson } from 'ai';
import { createSignal } from 'solid-js';
import type { z } from 'zod';

// use function to allow for mocking in tests:
const getOriginalFetch = () => fetch;

export type UseObjectOptions<RESULT> = {
  api: string;
  schema: z.ZodType<RESULT>;
  id?: string;
  initialValue?: DeepPartial<RESULT>;
  fetch?: FetchFunction;
  onFinish?: (event: {
    object: RESULT | undefined;
    error: Error | undefined;
  }) => Promise<void> | void;
  onError?: (error: Error) => void;
  headers?: Record<string, string> | Headers;
  credentials?: RequestCredentials;
};

export type UseObjectHelpers<RESULT, INPUT> = {
  submit: (input: INPUT) => void;
  readonly object: DeepPartial<RESULT> | undefined;
  readonly error: Error | undefined;
  readonly isLoading: boolean;
  stop: () => void;
  clear: () => void;
};

export function useObject<RESULT, INPUT = any>({
  api,
  id,
  schema,
  initialValue,
  fetch: fetchFn,
  onError,
  onFinish,
  headers,
  credentials,
}: UseObjectOptions<RESULT>): UseObjectHelpers<
  RESULT,
  INPUT
> {
  const [object, setObject] = createSignal<DeepPartial<RESULT> | undefined>(
    initialValue,
  );
  const [error, setError] = createSignal<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);

  let abortControllerRef: AbortController | null = null;

  const stop = () => {
    try {
      abortControllerRef?.abort();
    } catch (ignored) {
      // Ignore abort errors
    } finally {
      setIsLoading(false);
      abortControllerRef = null;
    }
  };

  const clearObject = () => {
    setError(undefined);
    setIsLoading(false);
    setObject(undefined);
  };

  const clear = () => {
    stop();
    clearObject();
  };

  const submit = async (input: INPUT) => {
    try {
      clearObject();

      setIsLoading(true);

      const abortController = new AbortController();
      abortControllerRef = abortController;

      const actualFetch = fetchFn ?? getOriginalFetch();
      const response = await actualFetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(headers instanceof Headers
            ? Object.fromEntries(headers.entries())
            : headers),
        },
        credentials,
        signal: abortController.signal,
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(
          (await response.text()) ?? 'Failed to fetch the response.',
        );
      }

      if (response.body == null) {
        throw new Error('The response body is empty.');
      }

      let accumulatedText = '';
      let latestObject: DeepPartial<RESULT> | undefined = undefined;

      await response.body.pipeThrough(new TextDecoderStream()).pipeTo(
        new WritableStream<string>({
          async write(chunk) {
            accumulatedText += chunk;

            const { value } = await parsePartialJson(accumulatedText);
            const currentObject = value as DeepPartial<RESULT>;

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
                schema: asSchema(schema),
              });

              onFinish(
                validationResult.success
                  ? { object: validationResult.value as RESULT, error: undefined }
                  : { object: undefined, error: validationResult.error },
              );
            }
          },
        }),
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
    clear,
  };
}
