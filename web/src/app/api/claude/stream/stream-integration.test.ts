import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { EventEmitter } from 'events';
import type { ChildProcess, SpawnOptions } from 'child_process';
import { POST } from './route';
import { setSpawnFunction, resetSpawnFunction, type SpawnFn } from '@/lib/cli-spawn';

// Create mock process factory
function createMockProcess(): ChildProcess & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: Mock;
} {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const proc = new EventEmitter() as ChildProcess & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: Mock;
    stdin: null;
    stdio: [null, EventEmitter, EventEmitter, null, null];
    pid: number;
    connected: boolean;
    exitCode: number | null;
    signalCode: null;
    spawnargs: string[];
    spawnfile: string;
  };
  proc.stdout = stdout;
  proc.stderr = stderr;
  proc.stdin = null;
  proc.stdio = [null, stdout, stderr, null, null];
  proc.pid = 12345;
  proc.connected = true;
  proc.exitCode = null;
  proc.signalCode = null;
  proc.spawnargs = [];
  proc.spawnfile = 'claude';
  proc.kill = vi.fn();
  return proc;
}

// Helper to create a mock request
function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/claude/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Helper to read SSE stream and parse events
async function readAndParseStream(response: Response, timeout = 1000): Promise<unknown[]> {
  const reader = response.body?.getReader();
  if (!reader) return [];

  const decoder = new TextDecoder();
  const events: unknown[] = [];

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Stream read timeout')), timeout);
  });

  try {
    while (true) {
      const { done, value } = await Promise.race([
        reader.read(),
        timeoutPromise,
      ]);
      if (done) break;
      const text = decoder.decode(value);
      // Parse SSE events (data: <content>\n\n)
      const matches = text.match(/data: ([^\n]+)\n\n/g);
      if (matches) {
        for (const match of matches) {
          const jsonStr = match.replace('data: ', '').replace('\n\n', '');
          try {
            events.push(JSON.parse(jsonStr));
          } catch {
            events.push({ raw: jsonStr });
          }
        }
      }
    }
  } catch (e) {
    if ((e as Error).message !== 'Stream read timeout') {
      throw e;
    }
  } finally {
    reader.releaseLock();
  }

  return events;
}

describe('Claude CLI Stream Integration', () => {
  let mockProcess: ReturnType<typeof createMockProcess>;
  let mockSpawn: Mock;

  beforeEach(() => {
    mockProcess = createMockProcess();
    mockSpawn = vi.fn(() => mockProcess) as unknown as Mock;
    setSpawnFunction(mockSpawn as unknown as SpawnFn);
  });

  afterEach(() => {
    resetSpawnFunction();
    vi.clearAllMocks();
    mockProcess.stdout.removeAllListeners();
    mockProcess.stderr.removeAllListeners();
    mockProcess.removeAllListeners();
  });

  describe('CLI output event types', () => {
    it('should pass through system init events', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        const systemEvent = JSON.stringify({
          type: 'system',
          subtype: 'init',
          session_id: 'test-session-123',
          cwd: '/test/path',
          model: 'claude-3-opus'
        });
        mockProcess.stdout.emit('data', Buffer.from(systemEvent + '\n'));
        setTimeout(() => mockProcess.emit('close', 0), 10);
      }, 10);

      const response = await POST(request);
      const events = await readAndParseStream(response);

      const initEvent = events.find((e: unknown) =>
        typeof e === 'object' && e !== null &&
        (e as { type?: string }).type === 'system'
      );
      expect(initEvent).toBeDefined();
      expect((initEvent as { session_id: string }).session_id).toBe('test-session-123');
    });

    it('should pass through content_block_delta events with text_delta', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        const deltaEvent = JSON.stringify({
          type: 'content_block_delta',
          index: 0,
          delta: {
            type: 'text_delta',
            text: 'Hello, how can I help you?'
          }
        });
        mockProcess.stdout.emit('data', Buffer.from(deltaEvent + '\n'));
        setTimeout(() => mockProcess.emit('close', 0), 10);
      }, 10);

      const response = await POST(request);
      const events = await readAndParseStream(response);

      const deltaEvent = events.find((e: unknown) =>
        typeof e === 'object' && e !== null &&
        (e as { type?: string }).type === 'content_block_delta'
      );
      expect(deltaEvent).toBeDefined();
      expect((deltaEvent as { delta: { type: string; text: string } }).delta.type).toBe('text_delta');
      expect((deltaEvent as { delta: { text: string } }).delta.text).toBe('Hello, how can I help you?');
    });

    it('should pass through assistant message events', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        const assistantEvent = JSON.stringify({
          type: 'assistant',
          message: {
            id: 'msg-123',
            type: 'message',
            role: 'assistant',
            content: [
              { type: 'text', text: 'This is a complete response.' }
            ],
            model: 'claude-3-opus',
            usage: { input_tokens: 10, output_tokens: 20 }
          }
        });
        mockProcess.stdout.emit('data', Buffer.from(assistantEvent + '\n'));
        setTimeout(() => mockProcess.emit('close', 0), 10);
      }, 10);

      const response = await POST(request);
      const events = await readAndParseStream(response);

      const assistantEvent = events.find((e: unknown) =>
        typeof e === 'object' && e !== null &&
        (e as { type?: string }).type === 'assistant'
      );
      expect(assistantEvent).toBeDefined();
      expect((assistantEvent as { message: { content: Array<{ text: string }> } }).message.content[0].text).toBe('This is a complete response.');
    });

    it('should handle result error events', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        const errorEvent = JSON.stringify({
          type: 'result',
          subtype: 'error',
          error: 'Authentication failed',
          is_error: true
        });
        mockProcess.stdout.emit('data', Buffer.from(errorEvent + '\n'));
        setTimeout(() => mockProcess.emit('close', 1), 10);
      }, 10);

      const response = await POST(request);
      const events = await readAndParseStream(response);

      const resultError = events.find((e: unknown) =>
        typeof e === 'object' && e !== null &&
        (e as { type?: string }).type === 'result' &&
        (e as { subtype?: string }).subtype === 'error'
      );
      expect(resultError).toBeDefined();
      expect((resultError as { error: string }).error).toBe('Authentication failed');
    });

    it('should stream multiple events in sequence', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        // Simulate a real CLI response sequence
        const events = [
          { type: 'system', subtype: 'init', session_id: 'sess-1' },
          { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
          { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello' } },
          { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: ' there!' } },
          { type: 'content_block_stop', index: 0 },
          { type: 'message_stop' },
          { type: 'result', subtype: 'success', is_error: false }
        ];

        for (const event of events) {
          mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(event) + '\n'));
        }
        setTimeout(() => mockProcess.emit('close', 0), 10);
      }, 10);

      const response = await POST(request);
      const receivedEvents = await readAndParseStream(response);

      // Should have all events plus stream_complete
      expect(receivedEvents.length).toBeGreaterThanOrEqual(7);

      // Check for text deltas
      const textDeltas = receivedEvents.filter((e: unknown) =>
        typeof e === 'object' && e !== null &&
        (e as { type?: string }).type === 'content_block_delta'
      );
      expect(textDeltas.length).toBe(2);
    });
  });

  describe('error scenarios', () => {
    it('should report stderr output as error events', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('CLI authentication error'));
        setTimeout(() => mockProcess.emit('close', 1), 10);
      }, 10);

      const response = await POST(request);
      const events = await readAndParseStream(response);

      const errorEvent = events.find((e: unknown) =>
        typeof e === 'object' && e !== null &&
        (e as { type?: string }).type === 'error'
      );
      expect(errorEvent).toBeDefined();
      expect((errorEvent as { message: string }).message).toContain('authentication error');
    });

    it('should include exit code in stream_complete', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        mockProcess.emit('close', 42);
      }, 10);

      const response = await POST(request);
      const events = await readAndParseStream(response);

      const completeEvent = events.find((e: unknown) =>
        typeof e === 'object' && e !== null &&
        (e as { type?: string }).type === 'stream_complete'
      );
      expect(completeEvent).toBeDefined();
      expect((completeEvent as { exitCode: number }).exitCode).toBe(42);
    });
  });
});
