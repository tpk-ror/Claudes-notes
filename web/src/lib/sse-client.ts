// SSE Client for streaming Claude CLI output from server to browser
// Based on PRD Section 4.5 and Appendix C

import {
  parseStreamLine,
  StreamEvent,
  isSystemInitEvent,
  isContentBlockDeltaEvent,
  isContentBlockStartEvent,
  isContentBlockStopEvent,
  isToolUseEvent,
  isToolResultEvent,
  isMessageStartEvent,
  isMessageStopEvent,
  isResultSuccessEvent,
  isResultErrorEvent,
  isTextDelta,
  isThinkingDelta,
  isToolInputDelta,
  isTextBlock,
  isToolUseBlock,
  isThinkingBlockContent,
} from './stream-parser';
import { parseCliError, parseSpawnError, CliError } from './cli-errors';

// Re-export CliError for consumers
export type { CliError } from './cli-errors';

// Event types for SSE client callbacks
export interface SSEClientEvents {
  onSessionInit?: (sessionId: string, model?: string) => void;
  onMessageStart?: (messageId: string) => void;
  onTextDelta?: (text: string, index: number) => void;
  onThinkingDelta?: (thinking: string, index: number) => void;
  onToolUse?: (toolId: string, toolName: string, input: Record<string, unknown>) => void;
  onToolResult?: (toolUseId: string, content: string, isError?: boolean) => void;
  onMessageStop?: () => void;
  onContentBlockStart?: (index: number, blockType: string, block: StreamEvent) => void;
  onContentBlockStop?: (index: number) => void;
  onResultSuccess?: (result: { costUsd?: number; totalCostUsd?: number; durationMs?: number; sessionId?: string }) => void;
  onResultError?: (error: string) => void;
  onStreamComplete?: (exitCode: number | null) => void;
  /** @deprecated Use onCliError for structured error handling */
  onSpawnError?: (message: string, code?: string) => void;
  /** @deprecated Use onCliError for structured error handling */
  onError?: (message: string) => void;
  /** Structured CLI error handler with user-friendly messages */
  onCliError?: (error: CliError) => void;
  onRawEvent?: (event: StreamEvent) => void;
}

// Request parameters for starting a stream
export interface StreamRequest {
  message: string;
  sessionId?: string;
  projectPath?: string;
}

// Response type for stream connection
export interface StreamConnection {
  abort: () => void;
  promise: Promise<void>;
}

// Internal event types sent by the server
interface StreamCompleteEvent {
  type: 'stream_complete';
  exitCode: number | null;
}

interface SpawnErrorEvent {
  type: 'spawn_error';
  message: string;
  code?: string;
}

interface ErrorEvent {
  type: 'error';
  message: string;
}

type ServerEvent = StreamEvent | StreamCompleteEvent | SpawnErrorEvent | ErrorEvent;

/**
 * Create an SSE client that connects to the Claude stream API
 * @param baseUrl The base URL for the API (defaults to '')
 * @returns Object with connect method
 */
export function createSSEClient(baseUrl: string = '') {
  /**
   * Connect to the stream API and start receiving events
   * @param request The stream request parameters
   * @param handlers Event handlers for stream events
   * @returns StreamConnection with abort method and promise
   */
  function connect(request: StreamRequest, handlers: SSEClientEvents): StreamConnection {
    const abortController = new AbortController();

    const promise = (async () => {
      try {
        const response = await fetch(`${baseUrl}/api/claude/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorBody.error || `HTTP ${response.status}`;
          const cliError = parseCliError(errorMessage);
          handlers.onCliError?.(cliError);
          handlers.onError?.(cliError.message);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          const cliError = parseCliError('No response body');
          handlers.onCliError?.(cliError);
          handlers.onError?.('No response body');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events (data: ...\n\n)
            const events = buffer.split('\n\n');
            // Keep the last incomplete chunk in buffer
            buffer = events.pop() || '';

            for (const eventStr of events) {
              if (!eventStr.trim()) continue;

              // Parse SSE format: "data: <json>"
              const dataMatch = eventStr.match(/^data:\s*(.+)$/m);
              if (!dataMatch) continue;

              const jsonStr = dataMatch[1];
              processEvent(jsonStr, handlers);
            }
          }

          // Process any remaining data in buffer
          if (buffer.trim()) {
            const dataMatch = buffer.match(/^data:\s*(.+)$/m);
            if (dataMatch) {
              processEvent(dataMatch[1], handlers);
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // Stream was aborted, don't report as error
          return;
        }
        const errorMessage = (error as Error).message || 'Connection error';
        const cliError = parseCliError(errorMessage);
        handlers.onCliError?.(cliError);
        handlers.onError?.(cliError.message);
      }
    })();

    return {
      abort: () => abortController.abort(),
      promise,
    };
  }

  return { connect };
}

/**
 * Process a single JSON event string and dispatch to handlers
 */
function processEvent(jsonStr: string, handlers: SSEClientEvents): void {
  // Try to parse as JSON first to check for server-specific events
  let parsed: ServerEvent;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const cliError = parseCliError(`Failed to parse event: ${jsonStr}`);
    handlers.onCliError?.(cliError);
    handlers.onError?.(`Failed to parse event: ${jsonStr}`);
    return;
  }

  // Handle server-specific events (not from CLI)
  if (parsed.type === 'stream_complete') {
    const event = parsed as StreamCompleteEvent;
    handlers.onStreamComplete?.(event.exitCode);
    return;
  }

  if (parsed.type === 'spawn_error') {
    const event = parsed as SpawnErrorEvent;
    const cliError = parseSpawnError(event.message, event.code);
    handlers.onCliError?.(cliError);
    // Keep backward compatibility with existing onSpawnError handler
    handlers.onSpawnError?.(cliError.message, event.code);
    return;
  }

  if (parsed.type === 'error') {
    const event = parsed as ErrorEvent;
    const cliError = parseCliError(event.message);
    handlers.onCliError?.(cliError);
    handlers.onError?.(cliError.message);
    return;
  }

  // Use stream-parser for CLI events
  const result = parseStreamLine(jsonStr);
  if (!result.success) {
    // Non-critical parse errors for empty lines are expected
    if (result.error !== 'Empty line') {
      handlers.onError?.(`Parse error: ${result.error}`);
    }
    return;
  }

  const event = result.event;

  // Dispatch raw event if handler exists
  handlers.onRawEvent?.(event);

  // Dispatch to specific handlers based on event type
  if (isSystemInitEvent(event)) {
    handlers.onSessionInit?.(event.session_id, event.model);
  } else if (isMessageStartEvent(event)) {
    handlers.onMessageStart?.(event.message.id);
  } else if (isContentBlockStartEvent(event)) {
    const block = event.content_block;
    let blockType = 'unknown';
    if (isTextBlock(block)) {
      blockType = 'text';
    } else if (isToolUseBlock(block)) {
      blockType = 'tool_use';
      // Also emit tool use event for the initial tool info
      handlers.onToolUse?.(block.id, block.name, block.input);
    } else if (isThinkingBlockContent(block)) {
      blockType = 'thinking';
    }
    handlers.onContentBlockStart?.(event.index, blockType, event);
  } else if (isContentBlockDeltaEvent(event)) {
    const delta = event.delta;
    if (isTextDelta(delta)) {
      handlers.onTextDelta?.(delta.text, event.index);
    } else if (isThinkingDelta(delta)) {
      handlers.onThinkingDelta?.(delta.thinking, event.index);
    } else if (isToolInputDelta(delta)) {
      // Tool input deltas are partial JSON, typically handled by accumulating
      // We could emit a separate event for this if needed
    }
  } else if (isContentBlockStopEvent(event)) {
    handlers.onContentBlockStop?.(event.index);
  } else if (isToolUseEvent(event)) {
    handlers.onToolUse?.(event.tool.id, event.tool.name, event.tool.input);
  } else if (isToolResultEvent(event)) {
    handlers.onToolResult?.(event.tool_use_id, event.content, event.is_error);
  } else if (isMessageStopEvent(event)) {
    handlers.onMessageStop?.();
  } else if (isResultSuccessEvent(event)) {
    handlers.onResultSuccess?.({
      costUsd: event.cost_usd,
      totalCostUsd: event.total_cost_usd,
      durationMs: event.duration_ms,
      sessionId: event.session_id,
    });
  } else if (isResultErrorEvent(event)) {
    handlers.onResultError?.(event.error);
  }
}

// Default client instance for convenience
export const sseClient = createSSEClient();
