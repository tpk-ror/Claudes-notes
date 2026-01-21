import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkClaudeCliAvailable,
  clearCliCheckCache,
  getCachedCliCheckResult,
  setExecSyncFunction,
  resetExecSyncFunction,
  ExecSyncFn,
} from './cli-check';

describe('cli-check', () => {
  let mockExecSync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear cache before each test
    clearCliCheckCache();
    mockExecSync = vi.fn();
    setExecSyncFunction(mockExecSync as ExecSyncFn);
  });

  afterEach(() => {
    resetExecSyncFunction();
    vi.clearAllMocks();
  });

  describe('checkClaudeCliAvailable', () => {
    it('returns available true when CLI is found', () => {
      mockExecSync.mockReturnValue('claude v1.0.0\n');

      const result = checkClaudeCliAvailable();

      expect(result).toEqual({
        available: true,
        version: 'claude v1.0.0',
      });
    });

    it('calls execSync with correct arguments', () => {
      mockExecSync.mockReturnValue('claude v1.0.0');

      checkClaudeCliAvailable();

      expect(mockExecSync).toHaveBeenCalledWith('claude --version', {
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    });

    it('returns error when CLI is not found (ENOENT)', () => {
      const error = new Error('Command not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      const result = checkClaudeCliAvailable();

      expect(result).toEqual({
        available: false,
        error: 'Claude CLI not found in PATH. Please install it first.',
      });
    });

    it('returns error when CLI check times out', () => {
      const error = new Error('Timeout') as NodeJS.ErrnoException & { killed: boolean };
      error.code = 'ETIMEDOUT';
      error.killed = true;
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      const result = checkClaudeCliAvailable();

      expect(result).toEqual({
        available: false,
        error: 'Claude CLI check timed out',
      });
    });

    it('returns error when CLI exits with non-zero status', () => {
      const error = new Error('Command failed') as NodeJS.ErrnoException & { status: number };
      error.status = 1;
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      const result = checkClaudeCliAvailable();

      expect(result).toEqual({
        available: false,
        error: 'Claude CLI exited with code 1',
      });
    });

    it('returns generic error for unknown errors', () => {
      const error = new Error('Unknown error');
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      const result = checkClaudeCliAvailable();

      expect(result).toEqual({
        available: false,
        error: 'Unknown error',
      });
    });
  });

  describe('caching', () => {
    it('caches the result on successful check', () => {
      mockExecSync.mockReturnValue('claude v1.0.0');

      checkClaudeCliAvailable();
      checkClaudeCliAvailable();
      checkClaudeCliAvailable();

      // Should only call execSync once due to caching
      expect(mockExecSync).toHaveBeenCalledTimes(1);
    });

    it('caches the result on failed check', () => {
      const error = new Error('Not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      checkClaudeCliAvailable();
      checkClaudeCliAvailable();
      checkClaudeCliAvailable();

      // Should only call execSync once due to caching
      expect(mockExecSync).toHaveBeenCalledTimes(1);
    });

    it('bypasses cache when forceRefresh is true', () => {
      mockExecSync.mockReturnValue('claude v1.0.0');

      checkClaudeCliAvailable();
      checkClaudeCliAvailable(true);
      checkClaudeCliAvailable(true);

      // Should call execSync for each forceRefresh
      expect(mockExecSync).toHaveBeenCalledTimes(3);
    });
  });

  describe('clearCliCheckCache', () => {
    it('clears the cached result', () => {
      mockExecSync.mockReturnValue('claude v1.0.0');

      checkClaudeCliAvailable();
      expect(mockExecSync).toHaveBeenCalledTimes(1);

      clearCliCheckCache();

      checkClaudeCliAvailable();
      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCachedCliCheckResult', () => {
    it('returns null when no cached result exists', () => {
      const result = getCachedCliCheckResult();
      expect(result).toBeNull();
    });

    it('returns the cached result after a check', () => {
      mockExecSync.mockReturnValue('claude v1.0.0');

      checkClaudeCliAvailable();

      const cached = getCachedCliCheckResult();
      expect(cached).toEqual({
        available: true,
        version: 'claude v1.0.0',
      });
    });

    it('returns null after cache is cleared', () => {
      mockExecSync.mockReturnValue('claude v1.0.0');

      checkClaudeCliAvailable();
      clearCliCheckCache();

      const cached = getCachedCliCheckResult();
      expect(cached).toBeNull();
    });
  });
});
