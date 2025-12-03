import { UIMessage, AbstractChat, ChatInit, CompletionRequestOptions, UseCompletionOptions, DeepPartial } from 'ai';
export { CreateUIMessage, UIMessage, UseCompletionOptions } from 'ai';
import { FetchFunction } from '@ai-sdk/provider-utils';
import { z } from 'zod';

declare class Chat<UI_MESSAGE extends UIMessage> extends AbstractChat<UI_MESSAGE> {
    #private;
    constructor({ messages, ...init }: ChatInit<UI_MESSAGE>);
    '~registerMessagesCallback': (onChange: () => void, throttleWaitMs?: number) => (() => void);
    '~registerStatusCallback': (onChange: () => void) => (() => void);
    '~registerErrorCallback': (onChange: () => void) => (() => void);
}

type UseChatHelpers<UI_MESSAGE extends UIMessage> = {
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
    setMessages: (messages: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[])) => void;
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
type UseChatOptions<UI_MESSAGE extends UIMessage> = ({
    chat: Chat<UI_MESSAGE>;
} | ChatInit<UI_MESSAGE>) & {
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
declare function useChat<UI_MESSAGE extends UIMessage = UIMessage>(options?: UseChatOptions<UI_MESSAGE>): UseChatHelpers<UI_MESSAGE>;

type UseCompletionHelpers = {
    /** The current completion text */
    readonly completion: string;
    /** Send a new prompt to the API */
    complete: (prompt: string, options?: CompletionRequestOptions) => Promise<string | null | undefined>;
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
    handleInputChange: (event: Event & {
        currentTarget: HTMLInputElement | HTMLTextAreaElement;
    }) => void;
    /** Handle form submission */
    handleSubmit: (event?: {
        preventDefault?: () => void;
    }) => void;
    /** Whether a request is currently in progress */
    readonly isLoading: boolean;
};
declare function useCompletion(options?: UseCompletionOptions & {
    experimental_throttle?: number;
}): UseCompletionHelpers;

type Experimental_UseObjectOptions<RESULT> = {
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
type Experimental_UseObjectHelpers<RESULT, INPUT> = {
    submit: (input: INPUT) => void;
    readonly object: DeepPartial<RESULT> | undefined;
    readonly error: Error | undefined;
    readonly isLoading: boolean;
    stop: () => void;
    clear: () => void;
};
declare function useObject<RESULT, INPUT = any>({ api, id, schema, initialValue, fetch: fetchFn, onError, onFinish, headers, credentials, }: Experimental_UseObjectOptions<RESULT>): Experimental_UseObjectHelpers<RESULT, INPUT>;
declare const experimental_useObject: typeof useObject;

export { Chat, type Experimental_UseObjectHelpers, type Experimental_UseObjectOptions, type UseChatHelpers, type UseChatOptions, type UseCompletionHelpers, experimental_useObject, useChat, useCompletion };
