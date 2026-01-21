import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSSEClient, SSEClientEvents, StreamRequest, CliError } from './sse-client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create a mock response with a readable stream
function createMockResponse(
  data: string[],
  status = 200,
  statusText = 'OK'
): Response {
  let index = 0;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    pull(controller) {
      if (index < data.length) {
        controller.enqueue(encoder.encode(data[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status,
    statusText,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

// Helper to create SSE formatted data
function sseEvent(data: object | string): string {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  return `data: ${json}\n\n`;
}

describe('sse-client', () => {
  let handlers: SSEClientEvents;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = {
      onSessionInit: vi.fn(),
      onMessageStart: vi.fn(),
      onTextDelta: vi.fn(),
      onThinkingDelta: vi.fn(),
      onToolUse: vi.fn(),
      onToolResult: vi.fn(),
      onMessageStop: vi.fn(),
      onContentBlockStart: vi.fn(),
      onContentBlockStop: vi.fn(),
      onResultSuccess: vi.fn(),
      onResultError: vi.fn(),
      onStreamComplete: vi.fn(),
      onSpawnError: vi.fn(),
      onError: vi.fn(),
      onCliError: vi.fn(),
      onRawEvent: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('connect', () => {
    it('should make POST request to /api/claude/stream', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([sseEvent({ type: 'stream_complete', exitCode: 0 })])
      );

      const client = createSSEClient();
      const request: StreamRequest = { message: 'Hello' };
      const connection = client.connect(request, handlers);

      await connection.promise;

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/claude/stream',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Hello' }),
        })
      );
    });

    it('should include sessionId in request when provided', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([sseEvent({ type: 'stream_complete', exitCode: 0 })])
      );

      const client = createSSEClient();
      const request: StreamRequest = { message: 'Hello', sessionId: 'session-123' };
      const connection = client.connect(request, handlers);

      await connection.promise;

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/claude/stream',
        expect.objectContaining({
          body: JSON.stringify({ message: 'Hello', sessionId: 'session-123' }),
        })
      );
    });

    it('should include projectPath in request when provided', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([sseEvent({ type: 'stream_complete', exitCode: 0 })])
      );

      const client = createSSEClient();
      const request: StreamRequest = { message: 'Hello', projectPath: '/path/to/project' };
      const connection = client.connect(request, handlers);

      await connection.promise;

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/claude/stream',
        expect.objectContaining({
          body: JSON.stringify({ message: 'Hello', projectPath: '/path/to/project' }),
        })
      );
    });

    it('should use custom baseUrl when provided', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([sseEvent({ type: 'stream_complete', exitCode: 0 })])
      );

      const client = createSSEClient('http://localhost:3001');
      const request: StreamRequest = { message: 'Hello' };
      const connection = client.connect(request, handlers);

      await connection.promise;

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/claude/stream',
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should call onError for non-ok HTTP response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Message is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const client = createSSEClient();
      const connection = client.connect({ message: '' }, handlers);

      await connection.promise;

      // onError receives user-friendly message
      expect(handlers.onError).toHaveBeenCalledWith('An unexpected error occurred');
      // onCliError receives structured error with original message
      expect(handlers.onCliError).toHaveBeenCalledWith(
        expect.objectContaining({
          originalMessage: 'Message is required',
          message: 'An unexpected error occurred',
          category: 'unknown',
        })
      );
    });

    it('should call onError for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      // onError receives user-friendly message
      expect(handlers.onError).toHaveBeenCalledWith('Network error');
      // onCliError receives structured error
      expect(handlers.onCliError).toHaveBeenCalledWith(
        expect.objectContaining({
          originalMessage: 'Network error',
          category: 'network',
        })
      );
    });

    it('should call onSpawnError for spawn errors with user-friendly message', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({ type: 'spawn_error', message: 'spawn claude ENOENT', code: 'ENOENT' }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      // onSpawnError receives user-friendly message and code
      expect(handlers.onSpawnError).toHaveBeenCalledWith('Claude CLI not found', 'ENOENT');
      // onCliError receives structured error
      expect(handlers.onCliError).toHaveBeenCalledWith(
        expect.objectContaining({
          originalMessage: 'spawn claude ENOENT',
          message: 'Claude CLI not found',
          category: 'cli_not_found',
          code: 'ENOENT',
        })
      );
    });

    it('should call onError for stderr messages with user-friendly message', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({ type: 'error', message: 'Rate limit exceeded' }),
          sseEvent({ type: 'stream_complete', exitCode: 1 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      // onError receives user-friendly message
      expect(handlers.onError).toHaveBeenCalledWith('Rate limit reached');
      // onCliError receives structured error
      expect(handlers.onCliError).toHaveBeenCalledWith(
        expect.objectContaining({
          originalMessage: 'Rate limit exceeded',
          message: 'Rate limit reached',
          category: 'rate_limit',
        })
      );
    });

    it('should not call onError when stream is aborted', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onError).not.toHaveBeenCalled();
      expect(handlers.onCliError).not.toHaveBeenCalled();
    });

    it('should provide structured error for authentication errors', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({ type: 'error', message: 'Not authenticated. Please run claude login.' }),
          sseEvent({ type: 'stream_complete', exitCode: 1 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onCliError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          category: 'authentication',
          recoverable: false,
          suggestion: expect.stringContaining('claude login'),
        })
      );
    });

    it('should provide structured error for timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timed out'));

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onCliError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Request timed out',
          category: 'timeout',
          recoverable: true,
        })
      );
    });
  });

  describe('stream events', () => {
    it('should call onStreamComplete when stream completes', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([sseEvent({ type: 'stream_complete', exitCode: 0 })])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onStreamComplete).toHaveBeenCalledWith(0);
    });

    it('should call onSessionInit for system init events', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'system',
            subtype: 'init',
            session_id: 'sess-abc',
            model: 'claude-sonnet-4-20250514',
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onSessionInit).toHaveBeenCalledWith('sess-abc', 'claude-sonnet-4-20250514');
    });

    it('should call onMessageStart for message_start events', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'message_start',
            message: {
              id: 'msg-123',
              type: 'message',
              role: 'assistant',
              content: [],
              model: 'claude-sonnet-4-20250514',
              stop_reason: null,
              stop_sequence: null,
              usage: { input_tokens: 10, output_tokens: 0 },
            },
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onMessageStart).toHaveBeenCalledWith('msg-123');
    });

    it('should call onTextDelta for text deltas', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'Hello ' },
          }),
          sseEvent({
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'world!' },
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onTextDelta).toHaveBeenCalledTimes(2);
      expect(handlers.onTextDelta).toHaveBeenNthCalledWith(1, 'Hello ', 0);
      expect(handlers.onTextDelta).toHaveBeenNthCalledWith(2, 'world!', 0);
    });

    it('should call onThinkingDelta for thinking deltas', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'thinking_delta', thinking: 'Let me think...' },
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onThinkingDelta).toHaveBeenCalledWith('Let me think...', 0);
    });

    it('should call onContentBlockStart for content block start events', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'content_block_start',
            index: 0,
            content_block: { type: 'text', text: '' },
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onContentBlockStart).toHaveBeenCalledWith(0, 'text', expect.any(Object));
    });

    it('should call onToolUse for tool_use content blocks', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'content_block_start',
            index: 1,
            content_block: {
              type: 'tool_use',
              id: 'tool-123',
              name: 'read_file',
              input: { path: '/src/index.ts' },
            },
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onContentBlockStart).toHaveBeenCalledWith(1, 'tool_use', expect.any(Object));
      expect(handlers.onToolUse).toHaveBeenCalledWith('tool-123', 'read_file', { path: '/src/index.ts' });
    });

    it('should call onToolUse for tool_use events', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'tool_use',
            tool: {
              id: 'tool-456',
              name: 'write_file',
              input: { path: '/src/index.ts', content: 'test' },
            },
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onToolUse).toHaveBeenCalledWith('tool-456', 'write_file', {
        path: '/src/index.ts',
        content: 'test',
      });
    });

    it('should call onToolResult for tool_result events', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'tool_result',
            tool_use_id: 'tool-123',
            content: 'File contents here',
            is_error: false,
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onToolResult).toHaveBeenCalledWith('tool-123', 'File contents here', false);
    });

    it('should call onToolResult with is_error for error results', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'tool_result',
            tool_use_id: 'tool-123',
            content: 'File not found',
            is_error: true,
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onToolResult).toHaveBeenCalledWith('tool-123', 'File not found', true);
    });

    it('should call onContentBlockStop for content block stop events', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({ type: 'content_block_stop', index: 0 }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onContentBlockStop).toHaveBeenCalledWith(0);
    });

    it('should call onMessageStop for message_stop events', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({ type: 'message_stop' }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onMessageStop).toHaveBeenCalled();
    });

    it('should call onResultSuccess for result success events', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'result',
            subtype: 'success',
            cost_usd: 0.05,
            total_cost_usd: 1.25,
            duration_ms: 1500,
            is_error: false,
            session_id: 'sess-123',
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onResultSuccess).toHaveBeenCalledWith({
        costUsd: 0.05,
        totalCostUsd: 1.25,
        durationMs: 1500,
        sessionId: 'sess-123',
      });
    });

    it('should call onResultError for result error events', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'result',
            subtype: 'error',
            error: 'Rate limit exceeded',
            is_error: true,
          }),
          sseEvent({ type: 'stream_complete', exitCode: 1 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onResultError).toHaveBeenCalledWith('Rate limit exceeded');
    });

    it('should call onRawEvent for all events when handler is provided', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({ type: 'message_stop' }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onRawEvent).toHaveBeenCalledWith({ type: 'message_stop' });
    });
  });

  describe('abort', () => {
    it('should return connection object with abort function', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([sseEvent({ type: 'stream_complete', exitCode: 0 })])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      // Verify connection has abort function
      expect(connection.abort).toBeInstanceOf(Function);
      expect(connection.promise).toBeInstanceOf(Promise);

      await connection.promise;
    });

    it('should not call onError when fetch rejects with AbortError', async () => {
      // Mock fetch to immediately reject with AbortError (simulates aborted request)
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      // Error handler should not be called for aborts
      expect(handlers.onError).not.toHaveBeenCalled();
    });

    it('should pass AbortSignal to fetch', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([sseEvent({ type: 'stream_complete', exitCode: 0 })])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      // Verify fetch was called with an AbortSignal
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('chunked data handling', () => {
    it('should handle events split across chunks', async () => {
      // Simulate data being split across multiple chunks
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          'data: {"type":"content_block_delta","index":0,',  // Partial JSON
          '"delta":{"type":"text_delta","text":"Hi"}}\n\n',  // Rest of event
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onTextDelta).toHaveBeenCalledWith('Hi', 0);
    });

    it('should handle multiple events in one chunk', async () => {
      const multipleEvents =
        sseEvent({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'A' } }) +
        sseEvent({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'B' } }) +
        sseEvent({ type: 'stream_complete', exitCode: 0 });

      mockFetch.mockResolvedValueOnce(createMockResponse([multipleEvents]));

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onTextDelta).toHaveBeenCalledTimes(2);
      expect(handlers.onTextDelta).toHaveBeenNthCalledWith(1, 'A', 0);
      expect(handlers.onTextDelta).toHaveBeenNthCalledWith(2, 'B', 0);
    });
  });

  describe('thinking block content', () => {
    it('should call onContentBlockStart with thinking type', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          sseEvent({
            type: 'content_block_start',
            index: 0,
            content_block: { type: 'thinking', thinking: '' },
          }),
          sseEvent({ type: 'stream_complete', exitCode: 0 }),
        ])
      );

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onContentBlockStart).toHaveBeenCalledWith(0, 'thinking', expect.any(Object));
    });
  });

  describe('full conversation simulation', () => {
    it('should handle a complete conversation flow', async () => {
      const events = [
        sseEvent({ type: 'system', subtype: 'init', session_id: 'sess-abc', model: 'claude-3' }),
        sseEvent({
          type: 'message_start',
          message: {
            id: 'msg-1',
            type: 'message',
            role: 'assistant',
            content: [],
            model: 'claude-3',
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 0 },
          },
        }),
        sseEvent({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }),
        sseEvent({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello! ' } }),
        sseEvent({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'How can I help?' } }),
        sseEvent({ type: 'content_block_stop', index: 0 }),
        sseEvent({ type: 'message_stop' }),
        sseEvent({
          type: 'result',
          subtype: 'success',
          cost_usd: 0.01,
          total_cost_usd: 0.01,
          duration_ms: 500,
          is_error: false,
          session_id: 'sess-abc',
        }),
        sseEvent({ type: 'stream_complete', exitCode: 0 }),
      ];

      mockFetch.mockResolvedValueOnce(createMockResponse([events.join('')]));

      const client = createSSEClient();
      const connection = client.connect({ message: 'Hello' }, handlers);

      await connection.promise;

      expect(handlers.onSessionInit).toHaveBeenCalledWith('sess-abc', 'claude-3');
      expect(handlers.onMessageStart).toHaveBeenCalledWith('msg-1');
      expect(handlers.onContentBlockStart).toHaveBeenCalledWith(0, 'text', expect.any(Object));
      expect(handlers.onTextDelta).toHaveBeenCalledTimes(2);
      expect(handlers.onContentBlockStop).toHaveBeenCalledWith(0);
      expect(handlers.onMessageStop).toHaveBeenCalled();
      expect(handlers.onResultSuccess).toHaveBeenCalledWith({
        costUsd: 0.01,
        totalCostUsd: 0.01,
        durationMs: 500,
        sessionId: 'sess-abc',
      });
      expect(handlers.onStreamComplete).toHaveBeenCalledWith(0);
    });

    it('should handle conversation with tool use', async () => {
      const events = [
        sseEvent({ type: 'system', subtype: 'init', session_id: 'sess-abc' }),
        sseEvent({
          type: 'message_start',
          message: {
            id: 'msg-1',
            type: 'message',
            role: 'assistant',
            content: [],
            model: 'claude-3',
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 0 },
          },
        }),
        sseEvent({
          type: 'content_block_start',
          index: 0,
          content_block: {
            type: 'tool_use',
            id: 'tool-1',
            name: 'read_file',
            input: { path: '/src/index.ts' },
          },
        }),
        sseEvent({ type: 'content_block_stop', index: 0 }),
        sseEvent({
          type: 'tool_result',
          tool_use_id: 'tool-1',
          content: 'export default function main() {}',
          is_error: false,
        }),
        sseEvent({ type: 'message_stop' }),
        sseEvent({ type: 'stream_complete', exitCode: 0 }),
      ];

      mockFetch.mockResolvedValueOnce(createMockResponse([events.join('')]));

      const client = createSSEClient();
      const connection = client.connect({ message: 'Read the main file' }, handlers);

      await connection.promise;

      expect(handlers.onToolUse).toHaveBeenCalledWith('tool-1', 'read_file', { path: '/src/index.ts' });
      expect(handlers.onToolResult).toHaveBeenCalledWith(
        'tool-1',
        'export default function main() {}',
        false
      );
    });
  });
});
