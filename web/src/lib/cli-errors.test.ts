// Tests for CLI error handling
import { describe, it, expect } from 'vitest';
import {
  parseCliError,
  parseSpawnError,
  formatErrorForDisplay,
  getErrorIcon,
  shouldRetry,
  getRetryDelay,
  CliError,
  ErrorCategory,
} from './cli-errors';

describe('parseCliError', () => {
  describe('CLI not found errors', () => {
    it('should parse ENOENT error code', () => {
      const error = parseCliError('spawn claude ENOENT', 'ENOENT');
      expect(error.category).toBe('cli_not_found');
      expect(error.message).toBe('Claude CLI not found');
      expect(error.recoverable).toBe(false);
      expect(error.suggestion).toContain('Install Claude Code CLI');
    });

    it('should parse "command not found" message', () => {
      const error = parseCliError('bash: claude: command not found');
      expect(error.category).toBe('cli_not_found');
      expect(error.message).toBe('Claude CLI not found');
    });

    it('should parse Windows "not recognized" message', () => {
      const error = parseCliError("'claude' is not recognized as an internal or external command");
      expect(error.category).toBe('cli_not_found');
      expect(error.message).toBe('Claude CLI not found');
    });
  });

  describe('authentication errors', () => {
    it('should parse "not authenticated" message', () => {
      const error = parseCliError('Error: not authenticated. Please login first.');
      expect(error.category).toBe('authentication');
      expect(error.message).toBe('Authentication required');
      expect(error.suggestion).toContain('claude login');
    });

    it('should parse "unauthorized" message', () => {
      const error = parseCliError('Request failed: unauthorized');
      expect(error.category).toBe('authentication');
      expect(error.message).toBe('Authentication required');
    });

    it('should parse invalid API key message', () => {
      const error = parseCliError('Error: Invalid API key provided');
      expect(error.category).toBe('authentication');
      expect(error.message).toBe('Invalid API key');
    });

    it('should parse expired token message', () => {
      const error = parseCliError('Your token has expired. Please re-authenticate.');
      expect(error.category).toBe('authentication');
      expect(error.message).toBe('Authentication expired');
    });
  });

  describe('rate limit errors', () => {
    it('should parse rate limit message', () => {
      const error = parseCliError('Rate limit exceeded. Please wait before retrying.');
      expect(error.category).toBe('rate_limit');
      expect(error.message).toBe('Rate limit reached');
      expect(error.recoverable).toBe(true);
      expect(error.severity).toBe('warning');
    });

    it('should parse HTTP 429 error', () => {
      const error = parseCliError('HTTP 429: Too many requests');
      expect(error.category).toBe('rate_limit');
      expect(error.message).toBe('Rate limit reached');
    });

    it('should parse quota exceeded message', () => {
      const error = parseCliError('Quota exceeded for this billing period');
      expect(error.category).toBe('rate_limit');
      expect(error.message).toBe('Usage quota exceeded');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('network errors', () => {
    it('should parse ECONNREFUSED error', () => {
      const error = parseCliError('connect ECONNREFUSED 127.0.0.1:443');
      expect(error.category).toBe('network');
      expect(error.message).toBe('Connection refused');
      expect(error.recoverable).toBe(true);
    });

    it('should parse ENOTFOUND (DNS) error', () => {
      const error = parseCliError('getaddrinfo ENOTFOUND api.anthropic.com');
      expect(error.category).toBe('network');
      expect(error.message).toBe('Unable to reach server');
    });

    it('should parse general network error', () => {
      const error = parseCliError('Network error: socket disconnected');
      expect(error.category).toBe('network');
      expect(error.message).toBe('Network error');
    });
  });

  describe('timeout errors', () => {
    it('should parse ETIMEDOUT error', () => {
      const error = parseCliError('connect ETIMEDOUT 192.168.1.1:443');
      expect(error.category).toBe('timeout');
      expect(error.message).toBe('Request timed out');
      expect(error.recoverable).toBe(true);
      expect(error.severity).toBe('warning');
    });

    it('should parse timeout message', () => {
      const error = parseCliError('Request timed out after 30000ms');
      expect(error.category).toBe('timeout');
      expect(error.message).toBe('Request timed out');
    });
  });

  describe('permission errors', () => {
    it('should parse EACCES error', () => {
      const error = parseCliError('EACCES: permission denied, open /etc/config');
      expect(error.category).toBe('permission');
      expect(error.message).toBe('Permission denied');
      expect(error.recoverable).toBe(false);
    });

    it('should parse HTTP 403 error', () => {
      const error = parseCliError('HTTP 403: Forbidden');
      expect(error.category).toBe('permission');
      expect(error.message).toBe('Action not permitted');
    });
  });

  describe('session errors', () => {
    it('should parse session not found message', () => {
      const error = parseCliError('Session not found: abc123');
      expect(error.category).toBe('session');
      expect(error.message).toBe('Session not found');
      expect(error.recoverable).toBe(true);
      expect(error.severity).toBe('warning');
    });

    it('should parse session expired message', () => {
      const error = parseCliError('Session expired. Please start a new conversation.');
      expect(error.category).toBe('session');
      expect(error.message).toBe('Session expired');
    });
  });

  describe('validation errors', () => {
    it('should parse invalid input message', () => {
      const error = parseCliError('Validation error: invalid input format');
      expect(error.category).toBe('validation');
      expect(error.message).toBe('Invalid input');
      expect(error.recoverable).toBe(true);
    });

    it('should parse message too long error', () => {
      const error = parseCliError('Error: Message too long. Maximum length is 100000 characters.');
      expect(error.category).toBe('validation');
      expect(error.message).toBe('Message too long');
      expect(error.severity).toBe('warning');
    });
  });

  describe('server errors', () => {
    it('should parse HTTP 500 error', () => {
      const error = parseCliError('HTTP 500: Internal Server Error');
      expect(error.category).toBe('unknown');
      expect(error.message).toBe('Server error');
      expect(error.recoverable).toBe(true);
    });

    it('should parse HTTP 503 error', () => {
      const error = parseCliError('HTTP 503: Service Unavailable');
      expect(error.category).toBe('network');
      expect(error.message).toBe('Service temporarily unavailable');
    });

    it('should parse bad gateway error', () => {
      const error = parseCliError('502 Bad Gateway');
      expect(error.category).toBe('network');
      expect(error.message).toBe('Service temporarily unavailable');
    });
  });

  describe('unknown errors', () => {
    it('should handle unknown error messages', () => {
      const error = parseCliError('Something weird happened');
      expect(error.category).toBe('unknown');
      expect(error.message).toBe('An unexpected error occurred');
      expect(error.recoverable).toBe(true);
      expect(error.originalMessage).toBe('Something weird happened');
    });

    it('should preserve original message', () => {
      const error = parseCliError('  Trimmed message  ');
      expect(error.originalMessage).toBe('Trimmed message');
    });

    it('should include error code if provided', () => {
      const error = parseCliError('Unknown error', 'ERR_123');
      expect(error.code).toBe('ERR_123');
    });
  });

  describe('error code matching', () => {
    it('should match by error code when message does not match', () => {
      const error = parseCliError('Some generic message', 'ENOENT');
      expect(error.category).toBe('cli_not_found');
    });
  });
});

describe('parseSpawnError', () => {
  it('should parse spawn error same as CLI error', () => {
    const error = parseSpawnError('spawn claude ENOENT', 'ENOENT');
    expect(error.category).toBe('cli_not_found');
    expect(error.message).toBe('Claude CLI not found');
  });
});

describe('formatErrorForDisplay', () => {
  it('should format error with message only', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test error',
      category: 'unknown',
      severity: 'error',
      recoverable: true,
    };
    expect(formatErrorForDisplay(error)).toBe('Test error');
  });

  it('should format error with suggestion', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test error',
      category: 'unknown',
      severity: 'error',
      suggestion: 'Try this instead',
      recoverable: true,
    };
    expect(formatErrorForDisplay(error)).toBe('Test error\n\nTry this instead');
  });
});

describe('getErrorIcon', () => {
  it('should return terminal icon for cli_not_found', () => {
    expect(getErrorIcon('cli_not_found')).toBe('terminal');
  });

  it('should return key icon for authentication', () => {
    expect(getErrorIcon('authentication')).toBe('key');
  });

  it('should return clock icon for rate_limit', () => {
    expect(getErrorIcon('rate_limit')).toBe('clock');
  });

  it('should return wifi-off icon for network', () => {
    expect(getErrorIcon('network')).toBe('wifi-off');
  });

  it('should return lock icon for permission', () => {
    expect(getErrorIcon('permission')).toBe('lock');
  });

  it('should return history icon for session', () => {
    expect(getErrorIcon('session')).toBe('history');
  });

  it('should return hourglass icon for timeout', () => {
    expect(getErrorIcon('timeout')).toBe('hourglass');
  });

  it('should return alert-triangle icon for validation', () => {
    expect(getErrorIcon('validation')).toBe('alert-triangle');
  });

  it('should return alert-circle icon for unknown', () => {
    expect(getErrorIcon('unknown')).toBe('alert-circle');
  });
});

describe('shouldRetry', () => {
  it('should not retry non-recoverable errors', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'cli_not_found',
      severity: 'error',
      recoverable: false,
    };
    expect(shouldRetry(error)).toBe(false);
  });

  it('should retry network errors', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'network',
      severity: 'error',
      recoverable: true,
    };
    expect(shouldRetry(error)).toBe(true);
  });

  it('should retry timeout errors', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'timeout',
      severity: 'warning',
      recoverable: true,
    };
    expect(shouldRetry(error)).toBe(true);
  });

  it('should retry rate limit errors', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'rate_limit',
      severity: 'warning',
      recoverable: true,
    };
    expect(shouldRetry(error)).toBe(true);
  });

  it('should not retry authentication errors even if recoverable', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'authentication',
      severity: 'error',
      recoverable: true,
    };
    expect(shouldRetry(error)).toBe(false);
  });

  it('should not retry validation errors', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'validation',
      severity: 'error',
      recoverable: true,
    };
    expect(shouldRetry(error)).toBe(false);
  });
});

describe('getRetryDelay', () => {
  it('should return base delay of 1000ms for non-rate-limit errors', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'network',
      severity: 'error',
      recoverable: true,
    };
    expect(getRetryDelay(error, 1)).toBe(1000);
  });

  it('should return base delay of 5000ms for rate limit errors', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'rate_limit',
      severity: 'warning',
      recoverable: true,
    };
    expect(getRetryDelay(error, 1)).toBe(5000);
  });

  it('should use exponential backoff', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'network',
      severity: 'error',
      recoverable: true,
    };
    expect(getRetryDelay(error, 1)).toBe(1000);
    expect(getRetryDelay(error, 2)).toBe(2000);
    expect(getRetryDelay(error, 3)).toBe(4000);
    expect(getRetryDelay(error, 4)).toBe(8000);
  });

  it('should cap delay at 30 seconds', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'network',
      severity: 'error',
      recoverable: true,
    };
    expect(getRetryDelay(error, 10)).toBe(30000);
  });

  it('should default to first attempt if not specified', () => {
    const error: CliError = {
      originalMessage: 'test',
      message: 'Test',
      category: 'network',
      severity: 'error',
      recoverable: true,
    };
    expect(getRetryDelay(error)).toBe(1000);
  });
});
