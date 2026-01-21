// API endpoint that spawns Claude CLI and streams output via SSE
// Based on PRD Section 4.5 and Appendix C

import { spawn, ChildProcess } from 'child_process';
import { NextRequest } from 'next/server';

// Request body interface
interface StreamRequest {
  message: string;
  sessionId?: string;
  projectPath?: string;
}

// Track active CLI processes for cleanup
const activeProcesses = new Map<string, ChildProcess>();

// Exported for testing - allows injecting a mock spawn function
export type SpawnFn = typeof spawn;
let spawnFunction: SpawnFn = spawn;

export function setSpawnFunction(fn: SpawnFn): void {
  spawnFunction = fn;
}

export function resetSpawnFunction(): void {
  spawnFunction = spawn;
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: StreamRequest;

  console.log('[Claude API] Received request');

  try {
    body = await request.json();
  } catch {
    console.error('[Claude API] Invalid JSON in request body');
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { message, sessionId, projectPath } = body;
  console.log('[Claude API] Request body:', { message, sessionId, projectPath });

  if (!message || typeof message !== 'string') {
    console.error('[Claude API] Message is required');
    return new Response(
      JSON.stringify({ error: 'Message is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Build CLI arguments based on PRD spec
  const args: string[] = [
    '--print',
    '--output-format', 'stream-json',
    '--verbose',
    '--permission-mode', 'plan',
  ];

  // Add session resume flag if provided
  if (sessionId) {
    args.push('--resume', sessionId);
  }

  // Add the user message
  // On Windows with shell: true, we need to properly quote the message
  // to prevent shell word splitting on spaces
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    // Escape double quotes and wrap in double quotes for Windows cmd.exe
    const escapedMessage = message.replace(/"/g, '\\"');
    args.push('-p', `"${escapedMessage}"`);
  } else {
    args.push('-p', message);
  }

  // Track whether the controller has been closed
  let controllerClosed = false;

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Helper to safely enqueue data
      const safeEnqueue = (data: Uint8Array) => {
        if (!controllerClosed) {
          try {
            controller.enqueue(data);
          } catch {
            // Controller may have been closed
            controllerClosed = true;
          }
        }
      };

      // Helper to safely close controller
      const safeClose = () => {
        if (!controllerClosed) {
          controllerClosed = true;
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      };

      // Spawn the Claude CLI process from system PATH
      // The claude CLI must be globally installed and accessible in PATH
      // On Windows, we need shell: true because claude is typically a .cmd file
      const claudeCommand = 'claude';

      console.log('[Claude API] Spawning CLI:', claudeCommand);
      console.log('[Claude API] Args:', args);
      console.log('[Claude API] CWD:', projectPath || process.cwd());
      console.log('[Claude API] Using shell:', isWindows);

      const cliProcess = spawnFunction(claudeCommand, args, {
        cwd: projectPath || process.cwd(),
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: isWindows, // Required on Windows for .cmd files
      });

      // Store process reference for cleanup
      const processId = sessionId || Date.now().toString();
      activeProcesses.set(processId, cliProcess);
      console.log('[Claude API] Process spawned, pid:', cliProcess.pid);

      // Handle stdout - this is where stream-json output comes from
      cliProcess.stdout?.on('data', (data: Buffer) => {
        const rawOutput = data.toString();
        console.log('[Claude API] STDOUT:', rawOutput);
        const lines = rawOutput.split('\n').filter(line => line.trim());
        for (const line of lines) {
          console.log('[Claude API] Sending line:', line.substring(0, 200));
          // Send as SSE event
          const sseData = `data: ${line}\n\n`;
          safeEnqueue(encoder.encode(sseData));
        }
      });

      // Handle stderr for error messages
      cliProcess.stderr?.on('data', (data: Buffer) => {
        const errorMessage = data.toString();
        console.log('[Claude API] STDERR:', errorMessage);
        // Send errors as SSE events with error type
        const errorEvent = JSON.stringify({
          type: 'error',
          message: errorMessage
        });
        safeEnqueue(encoder.encode(`data: ${errorEvent}\n\n`));
      });

      // Handle process completion
      cliProcess.on('close', (code) => {
        console.log('[Claude API] Process closed with code:', code);
        activeProcesses.delete(processId);

        // Send completion event
        const completeEvent = JSON.stringify({
          type: 'stream_complete',
          exitCode: code,
        });
        safeEnqueue(encoder.encode(`data: ${completeEvent}\n\n`));
        safeClose();
      });

      // Handle spawn errors (e.g., CLI not found)
      cliProcess.on('error', (error) => {
        console.error('[Claude API] Spawn error:', error);
        activeProcesses.delete(processId);

        const errnoException = error as NodeJS.ErrnoException;
        let userMessage = error.message;

        if (errnoException.code === 'ENOENT') {
          userMessage = 'Claude CLI not found. Please install Claude Code CLI and ensure it is in your system PATH. Run "claude --version" in your terminal to verify installation.';
        }

        const errorEvent = JSON.stringify({
          type: 'spawn_error',
          message: userMessage,
          originalMessage: error.message,
          code: errnoException.code,
        });
        safeEnqueue(encoder.encode(`data: ${errorEvent}\n\n`));
        safeClose();
      });
    },

    cancel() {
      // Clean up all active processes when stream is cancelled
      for (const [id, proc] of activeProcesses) {
        proc.kill('SIGTERM');
        activeProcesses.delete(id);
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
