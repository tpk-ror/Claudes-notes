// Utility to check for claude CLI availability in PATH
// Used on app startup to validate CLI is installed

import { execSync, ExecSyncOptions } from 'child_process';

export interface CliCheckResult {
  available: boolean;
  version?: string;
  error?: string;
}

// Type for execSync function
export type ExecSyncFn = (command: string, options?: ExecSyncOptions) => string | Buffer;

// Injectable exec function for testing
let execSyncFunction: ExecSyncFn = execSync;

export function setExecSyncFunction(fn: ExecSyncFn): void {
  execSyncFunction = fn;
}

export function resetExecSyncFunction(): void {
  execSyncFunction = execSync;
}

// Cache the CLI check result to avoid repeated checks
let cachedResult: CliCheckResult | null = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Check if the claude CLI is available in PATH
 * Results are cached for 1 minute to avoid repeated checks
 */
export function checkClaudeCliAvailable(forceRefresh = false): CliCheckResult {
  const now = Date.now();

  // Return cached result if valid and not forcing refresh
  if (!forceRefresh && cachedResult && (now - lastCheckTime) < CACHE_TTL_MS) {
    return cachedResult;
  }

  try {
    // Try to get claude version to verify it's installed and working
    const output = execSyncFunction('claude --version', {
      encoding: 'utf-8',
      timeout: 5000, // 5 second timeout
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const version = (output as string).trim();
    cachedResult = {
      available: true,
      version,
    };
    lastCheckTime = now;
    return cachedResult;
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { status?: number; killed?: boolean };

    let errorMessage: string;
    if (err.code === 'ENOENT') {
      errorMessage = 'Claude CLI not found in PATH. Please install it first.';
    } else if (err.code === 'ETIMEDOUT' || err.killed) {
      errorMessage = 'Claude CLI check timed out';
    } else if (err.status !== undefined) {
      errorMessage = `Claude CLI exited with code ${err.status}`;
    } else {
      errorMessage = err.message || 'Unknown error checking CLI';
    }

    cachedResult = {
      available: false,
      error: errorMessage,
    };
    lastCheckTime = now;
    return cachedResult;
  }
}

/**
 * Clear the cached CLI check result
 * Useful for testing or forcing a recheck
 */
export function clearCliCheckCache(): void {
  cachedResult = null;
  lastCheckTime = 0;
}

/**
 * Get the cached result without performing a new check
 * Returns null if no cached result exists
 */
export function getCachedCliCheckResult(): CliCheckResult | null {
  return cachedResult;
}
