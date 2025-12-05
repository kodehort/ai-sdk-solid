# SolidJS AI Chat

A simple chat application built with SolidJS that connects to OpenAI models using the AI SDK.

## Setup

```bash
# Install dependencies
bun install

# Create .env file with your Anthropic API key
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Start the app
bun start
```

This runs both the SolidJS frontend (localhost:5175) and Hono backend (localhost:3000) concurrently.

## Tech Stack

- SolidJS 1.9
- Hono backend
- AI SDK (@ai-sdk/anthropic)
- Antroptic models

## Features

- Real-time chat interface
- Message streaming
- Object streaming
