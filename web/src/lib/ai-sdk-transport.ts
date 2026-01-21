/**
 * Custom transport layer for bridging Claude CLI stream-json events to AI SDK format.
 *
 * The AI SDK expects a specific streaming format, but our CLI outputs its own
 * stream-json format. This transport transforms CLI events into the format
 * expected by the AI SDK's useChat hook.
 */

import type {
  StreamEvent,
  SystemInitEvent,
  ContentBlockDeltaEvent,
  ResultSuccessEvent,
  ResultErrorEvent,
  ToolUseEvent,
  ToolResultEvent,
  ThinkingDelta,
  TextDelta,
} from './stream-parser';

export interface CliChatTransportOptions {
  /** Existing CLI session ID for resuming conversations */
  cliSessionId?: string;
  /** Project path for the CLI */
  projectPath?: string;
  /** Callback when a new CLI session ID is received */
  onSessionInit?: (sessionId: string) => void;
  /** Callback for error events */
  onError?: (error: string) => void;
  /** Callback when reasoning/thinking content is received */
  onReasoning?: (content: string, isComplete: boolean) => void;
  /** Callback when a tool call starts */
  onToolCallStart?: (id: string, name: string, args: Record<string, unknown>) => void;
  /** Callback when a tool result is received */
  onToolResult?: (id: string, result: string, isError: boolean) => void;
}

export interface TransformedChunk {
  /** Text content to append to the message */
  text?: string;
  /** Whether this chunk contains reasoning/thinking content */
  isReasoning?: boolean;
  /** Tool invocation data */
  toolCall?: {
    id: string;
    name: string;
    args: Record<string, unknown>;
  };
  /** Tool result data */
  toolResult?: {
    id: string;
    result: string;
    isError: boolean;
  };
  /** Session ID from CLI */
  sessionId?: string;
  /** Whether this is the final chunk */
  isComplete?: boolean;
  /** Error message if any */
  error?: string;
}

/**
 * Parse a single SSE data line and extract the JSON event
 */
function parseSSELine(line: string): StreamEvent | null {
  if (!line.startsWith('data: ')) return null;

  const data = line.slice(6);
  if (data === '[DONE]') return null;

  try {
    return JSON.parse(data) as StreamEvent;
  } catch {
    return null;
  }
}

/**
 * Transform a CLI stream event to chunks compatible with AI SDK format
 */
export function transformCliEvent(
  event: StreamEvent,
  options: CliChatTransportOptions
): TransformedChunk | null {
  // Handle system init - capture CLI session ID
  if (event.type === 'system' && (event as SystemInitEvent).subtype === 'init') {
    const initEvent = event as SystemInitEvent;
    if (initEvent.session_id && options.onSessionInit) {
      options.onSessionInit(initEvent.session_id);
    }
    return { sessionId: initEvent.session_id };
  }

  // Handle content block deltas (streaming text and thinking)
  if (event.type === 'content_block_delta') {
    const deltaEvent = event as ContentBlockDeltaEvent;

    if (deltaEvent.delta.type === 'text_delta') {
      const textDelta = deltaEvent.delta as TextDelta;
      return { text: textDelta.text };
    }

    if (deltaEvent.delta.type === 'thinking_delta') {
      const thinkingDelta = deltaEvent.delta as ThinkingDelta;
      if (options.onReasoning) {
        options.onReasoning(thinkingDelta.thinking, false);
      }
      return { text: thinkingDelta.thinking, isReasoning: true };
    }
  }

  // Handle tool use events
  if (event.type === 'tool_use') {
    const toolEvent = event as ToolUseEvent;
    if (options.onToolCallStart) {
      options.onToolCallStart(toolEvent.tool.id, toolEvent.tool.name, toolEvent.tool.input);
    }
    return {
      toolCall: {
        id: toolEvent.tool.id,
        name: toolEvent.tool.name,
        args: toolEvent.tool.input,
      },
    };
  }

  // Handle tool result events
  if (event.type === 'tool_result') {
    const resultEvent = event as ToolResultEvent;
    if (options.onToolResult) {
      options.onToolResult(resultEvent.tool_use_id, resultEvent.content, !!resultEvent.is_error);
    }
    return {
      toolResult: {
        id: resultEvent.tool_use_id,
        result: resultEvent.content,
        isError: !!resultEvent.is_error,
      },
    };
  }

  // Handle result events (success/error)
  if (event.type === 'result') {
    if ((event as ResultSuccessEvent).is_error === false) {
      const successEvent = event as ResultSuccessEvent;
      if (successEvent.session_id && options.onSessionInit) {
        options.onSessionInit(successEvent.session_id);
      }
      return { isComplete: true, sessionId: successEvent.session_id };
    } else {
      const errorEvent = event as ResultErrorEvent;
      if (options.onError) {
        options.onError(errorEvent.error);
      }
      return { error: errorEvent.error, isComplete: true };
    }
  }

  // Handle direct assistant message (non-streaming final)
  if (event.type === 'assistant') {
    // Extract text from content blocks
    const assistantEvent = event as { message: { content: Array<{ type: string; text?: string }> } };
    const textContent = assistantEvent.message.content
      .filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text)
      .join('');

    if (textContent) {
      return { text: textContent };
    }
  }

  return null;
}

/**
 * Create a fetch function that connects to the CLI streaming API
 * and transforms events to AI SDK format
 */
export function createCliStreamFetch(options: CliChatTransportOptions) {
  return async function cliStreamFetch(
    message: string,
    onChunk: (chunk: TransformedChunk) => void
  ): Promise<void> {
    const response = await fetch('/api/claude/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: options.cliSessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const event = parseSSELine(line);
        if (event) {
          const chunk = transformCliEvent(event, options);
          if (chunk) {
            onChunk(chunk);
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer) {
      const event = parseSSELine(buffer);
      if (event) {
        const chunk = transformCliEvent(event, options);
        if (chunk) {
          onChunk(chunk);
        }
      }
    }
  };
}

export type { StreamEvent };
