# Feature: Vercel AI SDK UI Integration

This document describes the integration of Vercel AI SDK UI components (AI Elements) into Claude's Notes web application.

## Overview

The integration uses [Vercel AI Elements](https://github.com/vercel/ai-elements), a component library built on shadcn/ui for AI-native applications. Components are installed directly into the codebase at `src/components/ai-elements/` for full customization.

The integration preserves the CLI subprocess architecture and `--resume` session capability while providing production-ready streaming UI components.

## Feature Flag

The integration uses a feature flag for incremental migration:

```bash
# Enable in .env.local
NEXT_PUBLIC_USE_AI_ELEMENTS=true
```

When enabled, the application uses:
- `AiChatPanel` with real ai-elements components (`Conversation`, `Message`, `Reasoning`, `Tool`)
- `AiPlanPanel` instead of `EnhancedPlanPanel`
- `useCliChat` hook for streaming management

## Architecture

### Custom Transport Layer

The transport layer (`web/src/lib/ai-sdk-transport.ts`) transforms CLI stream-json events to AI SDK format:

```typescript
import { createCliStreamFetch, type TransformedChunk } from "@/lib/ai-sdk-transport";

const streamFetch = createCliStreamFetch({
  cliSessionId: existingSessionId,
  projectPath: "/path/to/project",
  onSessionInit: (sessionId) => {
    // Capture CLI session ID for --resume
  },
  onReasoning: (content, isComplete) => {
    // Handle thinking/reasoning blocks
  },
  onToolCallStart: (id, name, args) => {
    // Handle tool invocations
  },
  onToolResult: (id, result, isError) => {
    // Handle tool results
  },
});

await streamFetch(message, (chunk: TransformedChunk) => {
  if (chunk.text) {
    // Text content to display
  }
  if (chunk.sessionId) {
    // CLI session ID received
  }
  if (chunk.isComplete) {
    // Stream finished
  }
});
```

### useCliChat Hook

The `useCliChat` hook (`web/src/hooks/use-cli-chat.ts`) bridges AI SDK patterns with CLI subprocess:

```typescript
import { useCliChat } from "@/hooks/use-cli-chat";

function ChatComponent({ projectPath }) {
  const {
    messages,        // ChatMessage[]
    sendMessage,     // (content: string, planContext?) => Promise<void>
    status,          // "submitted" | "streaming" | "ready" | "error"
    isStreaming,     // boolean
    stop,            // () => void
    cliSessionId,    // string | null
    activeReasoning, // ReasoningBlock[]
    activeToolCalls, // ToolInvocation[]
  } = useCliChat({
    projectPath,
    initialCliSessionId: existingSessionId,
    onSessionIdChange: (id) => { /* Update session store */ },
    onPlanDetected: (fileName) => { /* Route to plan editor */ },
    onPlanStream: (content) => { /* Stream to plan editor */ },
    onPlanComplete: (content, fileName) => { /* Finalize plan */ },
    onMessageComplete: (message) => { /* Sync to Zustand */ },
  });

  return (
    <AiMessageList messages={messages} isStreaming={isStreaming} />
  );
}
```

## Component Mapping

| Original Component | AI Element Used |
|-------------------|----------------------|
| `MessageList` | `Conversation`, `ConversationContent` - Auto-scrolling via `use-stick-to-bottom` |
| `MessageItem` | `Message`, `MessageContent`, `MessageResponse` - Uses `streamdown` for markdown |
| `ThinkingBlock` | `Reasoning`, `ReasoningTrigger`, `ReasoningContent` - Auto-open during streaming |
| `ToolCallCard` | `Tool`, `ToolHeader`, `ToolContent`, `ToolInput`, `ToolOutput` - Collapsible with status |
| `ChatInput` | Custom input with `Button` - Stop button during streaming |
| `EnhancedPlanPanel` | `AiPlanPanel` - Task parsing, shimmer animations |

## State Management

### Stays in Zustand

- `session-store` - CLI session IDs for `--resume`
- `plan-store` - Plan lifecycle (draft/approved/executed/archived)
- `plan-editor-store` - File editing, streaming to plan files
- `theme-store` - Dark/light mode

### Managed by useCliChat

- Messages array (native streaming support)
- Streaming status
- Active reasoning blocks
- Active tool calls

### Sync Layer

The `syncMessage` and `syncMessages` helpers in `message-store.ts` sync completed AI SDK messages to Zustand for database persistence.

## File Structure

```
web/src/
├── lib/
│   ├── ai-sdk-transport.ts    # CLI → AI SDK event transformer
│   └── cli-spawn.ts           # CLI spawn utilities (for testing)
├── hooks/
│   └── use-cli-chat.ts        # Main chat hook bridging CLI with AI patterns
├── components/
│   ├── ai-elements/           # Vercel AI Elements (installed via CLI)
│   │   ├── conversation.tsx   # Auto-scrolling container
│   │   ├── message.tsx        # Chat bubbles with markdown
│   │   ├── reasoning.tsx      # Collapsible thinking blocks
│   │   ├── tool.tsx           # Tool call cards
│   │   ├── loader.tsx         # Loading indicators
│   │   ├── shimmer.tsx        # Shimmer animations
│   │   ├── plan.tsx           # Plan display
│   │   ├── task.tsx           # Task items
│   │   └── ... (30+ components)
│   ├── chat/
│   │   └── ai/                # Custom wrapper components (optional)
│   ├── layout/
│   │   └── ai-chat-panel.tsx  # Complete chat panel using ai-elements
│   └── plan/
│       └── ai-plan-panel.tsx  # Task parsing, shimmer effects
└── app/
    └── page.tsx               # Feature flag conditional rendering
```

## Animations

Custom shimmer animations are defined in `globals.css`:

- `.animate-shimmer` - Gradient shimmer effect
- `.animate-shimmer-bar` - Horizontal bar animation
- `.animate-pulse-subtle` - Subtle opacity pulse

## Testing

### Manual Testing Checklist

1. Send a message, verify streaming updates UI progressively
2. Verify reasoning blocks auto-open during streaming, close when complete
3. Verify tool calls show running/complete status with collapsible content
4. Send a planning request, verify content routes to plan panel with shimmer
5. Refresh page, send follow-up message, verify session resumes via `--resume`
6. Test stop button during streaming
7. Test error states and retry functionality

### Automated Testing

```bash
cd web
npm run test        # Existing component tests
npm run build       # Verify no type errors
npm run dev         # Manual E2E testing
```

## Dependencies

```json
{
  "dependencies": {
    "@ai-sdk/react": "^3.0.0",
    "ai": "^6.0.0",
    "use-stick-to-bottom": "^1.0.0",
    "streamdown": "^1.0.0"
  }
}
```

### Installation

```bash
# Create components.json if not exists (for shadcn)
npx shadcn@latest init

# Install AI Elements (30+ components)
npx ai-elements@latest
```

AI Elements are installed directly into `web/src/components/ai-elements/` for full customization.

## Migration Path

1. **Phase 1 (Current)**: Feature flag controls component selection
2. **Phase 2**: Migrate all tests to AI components
3. **Phase 3**: Remove legacy components and feature flag

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| CLI stream format incompatibility | Custom transport transforms events |
| Plan detection timing changes | Same detection logic, new location |
| Session resume breaks | Explicit onSessionInit callback |
| Component styling mismatch | AI Elements uses shadcn/ui (matches existing) |

## Configuration

No additional environment variables required beyond the feature flag:

```env
# .env.local
NEXT_PUBLIC_USE_AI_ELEMENTS=true
```
