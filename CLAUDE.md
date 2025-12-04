# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SolidJS bindings for the Vercel AI SDK. Provides reactive hooks (`useChat`, `useCompletion`, `experimental_useObject`) for building AI-powered chat/completion UIs with SolidJS.

## Commands

```bash
npm run build       # Build with tsup
npm run test        # Run tests (vitest)
npm run test:watch  # Watch mode
npm run type-check  # TypeScript check
npm run lint        # ESLint
```

Single test: `npx vitest run src/use-chat.ui.test.tsx`

## Architecture

- `chat.solid.ts` - `Chat` class extends `AbstractChat` from ai sdk, wraps `SolidChatState` for reactivity via callback subscriptions
- `use-chat.ts` - Main hook, creates signals from Chat callbacks, handles throttling
- `use-completion.ts` - Simpler hook for single completions using `callCompletionApi`
- `use-object.ts` - Streams structured JSON objects with schema validation
- `throttle.ts` - Utility for throttling state updates

Pattern: hooks return objects with getter properties wrapping signals for reactivity (not raw signals).

## Testing

Tests use `@solidjs/testing-library` + msw for mocking. Test files: `*.ui.test.tsx`. Test server helper in `src/test-utils/test-server.ts`.
