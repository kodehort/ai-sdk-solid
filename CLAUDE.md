# CLAUDE.md

SolidJS bindings for the Vercel AI SDK. Provides reactive hooks (`useChat`, `useCompletion`, `useObject`) for building AI-powered chat/completion UIs with SolidJS.

## Commands

```bash
bun run build       # Build with tsup
bun run test        # Run tests (vitest)
bun run test:watch  # Watch mode
bun run typecheck   # TypeScript check
```

Single test: `bun vitest run src/use-chat.ui.test.tsx`

## Architecture

- `chat.solid.ts` - `Chat` class extends `AbstractChat` from ai sdk, wraps `SolidChatState` for reactivity via callback subscriptions
- `use-chat.ts` - Main hook, creates signals from Chat callbacks, handles throttling
- `use-completion.ts` - Simpler hook for single completions using `callCompletionApi`
- `use-object.ts` - Streams structured JSON objects with schema validation
- `throttle.ts` - Utility for throttling state updates

Pattern: hooks return objects with getter properties wrapping signals for reactivity (not raw signals).

## Testing

Tests use `@solidjs/testing-library` + `@ai-sdk/test-server` for mocking. Test files: `*.ui.test.tsx`.
