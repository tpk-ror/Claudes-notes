import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { EventEmitter } from 'events';
import type { ChildProcess, SpawnOptions } from 'child_process';
import { POST, setSpawnFunction, resetSpawnFunction, SpawnFn } from './route';

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

// Helper to read SSE stream
async function readStream(response: Response, timeout = 1000): Promise<string[]> {
  const reader = response.body?.getReader();
  if (!reader) return [];

  const decoder = new TextDecoder();
  const events: string[] = [];

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
          events.push(match.replace('data: ', '').replace('\n\n', ''));
        }
      }
    }
  } catch (e) {
    // Timeout or other error - return what we have
    if ((e as Error).message !== 'Stream read timeout') {
      throw e;
    }
  } finally {
    reader.releaseLock();
  }

  return events;
}

describe('/api/claude/stream', () => {
  let mockProcess: ReturnType<typeof createMockProcess>;
  let mockSpawn: Mock;
  let spawnCalls: Array<{ command: string; args: string[]; options: SpawnOptions }>;

  beforeEach(() => {
    mockProcess = createMockProcess();
    spawnCalls = [];
    mockSpawn = vi.fn((command: string, args: string[], options: SpawnOptions) => {
      spawnCalls.push({ command, args, options });
      return mockProcess;
    }) as unknown as Mock;
    setSpawnFunction(mockSpawn as unknown as SpawnFn);
  });

  afterEach(() => {
    resetSpawnFunction();
    vi.clearAllMocks();
    mockProcess.stdout.removeAllListeners();
    mockProcess.stderr.removeAllListeners();
    mockProcess.removeAllListeners();
  });

  describe('request validation', () => {
    it('should return 400 for invalid JSON body', async () => {
      const request = new Request('http://localhost:3000/api/claude/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Invalid JSON in request body');
    });

    it('should return 400 when message is missing', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Message is required');
    });

    it('should return 400 when message is not a string', async () => {
      const request = createMockRequest({ message: 123 });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Message is required');
    });
  });

  describe('CLI spawning', () => {
    it('should spawn claude CLI with correct arguments', async () => {
      const request = createMockRequest({ message: 'Hello Claude' });

      // Start the POST handler - this will spawn the process
      const responsePromise = POST(request);

      // Wait for the spawn to happen
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(spawnCalls.length).toBe(1);
      // Command should be 'claude' - resolved from system PATH
      expect(spawnCalls[0].command).toBe('claude');
      // On Windows, the message is quoted to prevent shell word splitting
      const isWindows = process.platform === 'win32';
      const expectedMessage = isWindows ? '"Hello Claude"' : 'Hello Claude';
      expect(spawnCalls[0].args).toEqual([
        '--print',
        '--output-format', 'stream-json',
        '--verbose',
        '--permission-mode', 'plan',
        '-p', expectedMessage,
      ]);
      expect(spawnCalls[0].options.stdio).toEqual(['ignore', 'pipe', 'pipe']);

      // Close the process to end the stream
      mockProcess.emit('close', 0);
      const response = await responsePromise;
      await readStream(response);
    });

    it('should include --resume flag when sessionId is provided', async () => {
      const request = createMockRequest({
        message: 'Continue our work',
        sessionId: 'session-123',
      });

      const responsePromise = POST(request);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(spawnCalls.length).toBe(1);
      expect(spawnCalls[0].args).toContain('--resume');
      expect(spawnCalls[0].args).toContain('session-123');

      mockProcess.emit('close', 0);
      const response = await responsePromise;
      await readStream(response);
    });

    it('should use projectPath as cwd when provided', async () => {
      const request = createMockRequest({
        message: 'Hello',
        projectPath: '/path/to/project',
      });

      const responsePromise = POST(request);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(spawnCalls.length).toBe(1);
      expect(spawnCalls[0].options.cwd).toBe('/path/to/project');

      mockProcess.emit('close', 0);
      const response = await responsePromise;
      await readStream(response);
    });

    it('should use shell option based on platform', async () => {
      const request = createMockRequest({ message: 'Hello' });

      const responsePromise = POST(request);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(spawnCalls.length).toBe(1);
      // On the test platform, shell should match whether we're on Windows or not
      const isWindows = process.platform === 'win32';
      expect(spawnCalls[0].options.shell).toBe(isWindows);

      mockProcess.emit('close', 0);
      const response = await responsePromise;
      await readStream(response);
    });
  });

  describe('SSE streaming', () => {
    it('should return SSE response with correct headers', async () => {
      const request = createMockRequest({ message: 'Hello' });

      // Schedule process close
      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');

      await readStream(response);
    });

    it('should stream stdout data as SSE events', async () => {
      const request = createMockRequest({ message: 'Hello' });

      // Schedule data emission and close
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"type":"content_block_delta","text":"Hi"}'));
        setTimeout(() => {
          mockProcess.emit('close', 0);
        }, 10);
      }, 10);

      const response = await POST(request);
      const events = await readStream(response);

      expect(events).toContainEqual('{"type":"content_block_delta","text":"Hi"}');
    });

    it('should handle multi-line stdout output', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"type":"event1"}\n{"type":"event2"}'));
        setTimeout(() => {
          mockProcess.emit('close', 0);
        }, 10);
      }, 10);

      const response = await POST(request);
      const events = await readStream(response);

      expect(events).toContainEqual('{"type":"event1"}');
      expect(events).toContainEqual('{"type":"event2"}');
    });

    it('should send stream_complete event when process closes', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      const response = await POST(request);
      const events = await readStream(response);

      const completeEvent = events.find(e => {
        try {
          const parsed = JSON.parse(e);
          return parsed.type === 'stream_complete';
        } catch {
          return false;
        }
      });

      expect(completeEvent).toBeDefined();
      const parsed = JSON.parse(completeEvent!);
      expect(parsed.exitCode).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should send error events from stderr', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('Some error message'));
        setTimeout(() => {
          mockProcess.emit('close', 1);
        }, 10);
      }, 10);

      const response = await POST(request);
      const events = await readStream(response);

      const errorEvent = events.find(e => {
        try {
          const parsed = JSON.parse(e);
          return parsed.type === 'error';
        } catch {
          return false;
        }
      });

      expect(errorEvent).toBeDefined();
      const parsed = JSON.parse(errorEvent!);
      expect(parsed.message).toBe('Some error message');
    });

    it('should send spawn_error event with helpful message when CLI is not found', async () => {
      const request = createMockRequest({ message: 'Hello' });

      setTimeout(() => {
        const error = new Error('spawn claude ENOENT') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        mockProcess.emit('error', error);
      }, 10);

      const response = await POST(request);
      const events = await readStream(response);

      const spawnErrorEvent = events.find(e => {
        try {
          const parsed = JSON.parse(e);
          return parsed.type === 'spawn_error';
        } catch {
          return false;
        }
      });

      expect(spawnErrorEvent).toBeDefined();
      const parsed = JSON.parse(spawnErrorEvent!);
      expect(parsed.code).toBe('ENOENT');
      expect(parsed.message).toContain('Claude CLI not found');
      expect(parsed.message).toContain('system PATH');
      expect(parsed.originalMessage).toContain('ENOENT');
    });
  });
});
