// CLI error handling with user-friendly messages
// Based on PRD FR-5.7: System shall handle CLI errors gracefully

/**
 * Error categories for UI display styling
 */
export type ErrorCategory =
  | 'cli_not_found'
  | 'authentication'
  | 'rate_limit'
  | 'network'
  | 'permission'
  | 'session'
  | 'timeout'
  | 'validation'
  | 'unknown';

/**
 * Severity levels for error display
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Structured error information for UI display
 */
export interface CliError {
  /** Original error message from CLI or system */
  originalMessage: string;
  /** User-friendly error message */
  message: string;
  /** Category for styling/grouping */
  category: ErrorCategory;
  /** Severity level */
  severity: ErrorSeverity;
  /** Optional suggestion for resolving the error */
  suggestion?: string;
  /** Optional documentation link */
  helpUrl?: string;
  /** Whether the error is recoverable */
  recoverable: boolean;
  /** Error code if available */
  code?: string;
}

/**
 * Error patterns to match against error messages
 */
interface ErrorPattern {
  pattern: RegExp | string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  suggestion?: string;
  helpUrl?: string;
  recoverable: boolean;
}

/**
 * Common CLI error patterns and their user-friendly mappings
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  // CLI not found errors
  {
    pattern: /ENOENT/i,
    category: 'cli_not_found',
    severity: 'error',
    message: 'Claude CLI not found',
    suggestion: 'Install Claude Code CLI and ensure it is in your PATH.',
    helpUrl: 'https://docs.anthropic.com/claude-code/installation',
    recoverable: false,
  },
  {
    pattern: /command not found|claude.*not found/i,
    category: 'cli_not_found',
    severity: 'error',
    message: 'Claude CLI not found',
    suggestion: 'Install Claude Code CLI and ensure it is in your PATH.',
    helpUrl: 'https://docs.anthropic.com/claude-code/installation',
    recoverable: false,
  },
  {
    pattern: /is not recognized as an internal or external command/i,
    category: 'cli_not_found',
    severity: 'error',
    message: 'Claude CLI not found',
    suggestion: 'Install Claude Code CLI and ensure it is in your PATH.',
    helpUrl: 'https://docs.anthropic.com/claude-code/installation',
    recoverable: false,
  },

  // Authentication errors
  {
    pattern: /not authenticated|authentication required|please login|unauthorized/i,
    category: 'authentication',
    severity: 'error',
    message: 'Authentication required',
    suggestion: 'Run "claude login" in your terminal to authenticate.',
    recoverable: false,
  },
  {
    pattern: /invalid.*api.*key|api.*key.*invalid/i,
    category: 'authentication',
    severity: 'error',
    message: 'Invalid API key',
    suggestion: 'Check your API key configuration or re-authenticate with "claude login".',
    recoverable: false,
  },
  {
    pattern: /expired.*token|token.*expired/i,
    category: 'authentication',
    severity: 'error',
    message: 'Authentication expired',
    suggestion: 'Your session has expired. Run "claude login" to re-authenticate.',
    recoverable: false,
  },

  // Rate limiting errors
  {
    pattern: /rate.*limit|too many requests|429/i,
    category: 'rate_limit',
    severity: 'warning',
    message: 'Rate limit reached',
    suggestion: 'Please wait a moment before sending another message.',
    recoverable: true,
  },
  {
    pattern: /quota.*exceeded|usage.*limit/i,
    category: 'rate_limit',
    severity: 'error',
    message: 'Usage quota exceeded',
    suggestion: 'You have reached your usage limit. Check your plan or wait for the limit to reset.',
    recoverable: false,
  },

  // Network errors
  {
    pattern: /ECONNREFUSED|connection refused/i,
    category: 'network',
    severity: 'error',
    message: 'Connection refused',
    suggestion: 'Check your internet connection and try again.',
    recoverable: true,
  },
  {
    pattern: /ENOTFOUND|DNS|getaddrinfo/i,
    category: 'network',
    severity: 'error',
    message: 'Unable to reach server',
    suggestion: 'Check your internet connection and DNS settings.',
    recoverable: true,
  },
  {
    pattern: /ETIMEDOUT|timed out|timeout/i,
    category: 'timeout',
    severity: 'warning',
    message: 'Request timed out',
    suggestion: 'The request took too long. Try again or check your connection.',
    recoverable: true,
  },
  {
    pattern: /network.*error|socket.*error|ENETUNREACH/i,
    category: 'network',
    severity: 'error',
    message: 'Network error',
    suggestion: 'Check your internet connection and try again.',
    recoverable: true,
  },

  // Permission errors
  {
    pattern: /EACCES|permission denied/i,
    category: 'permission',
    severity: 'error',
    message: 'Permission denied',
    suggestion: 'Check file permissions or run with appropriate access rights.',
    recoverable: false,
  },
  {
    pattern: /not allowed|forbidden|403/i,
    category: 'permission',
    severity: 'error',
    message: 'Action not permitted',
    suggestion: 'You may not have permission to perform this action.',
    recoverable: false,
  },

  // Session errors
  {
    pattern: /session.*not found|invalid.*session/i,
    category: 'session',
    severity: 'warning',
    message: 'Session not found',
    suggestion: 'The session may have expired. Start a new conversation.',
    recoverable: true,
  },
  {
    pattern: /session.*expired/i,
    category: 'session',
    severity: 'warning',
    message: 'Session expired',
    suggestion: 'Start a new conversation to continue.',
    recoverable: true,
  },

  // Validation errors
  {
    pattern: /invalid.*input|validation.*error|malformed/i,
    category: 'validation',
    severity: 'error',
    message: 'Invalid input',
    suggestion: 'Check your message and try again.',
    recoverable: true,
  },
  {
    pattern: /message.*too long|content.*too large|payload.*too large/i,
    category: 'validation',
    severity: 'warning',
    message: 'Message too long',
    suggestion: 'Try sending a shorter message.',
    recoverable: true,
  },

  // Server errors
  {
    pattern: /500|internal.*server.*error/i,
    category: 'unknown',
    severity: 'error',
    message: 'Server error',
    suggestion: 'An unexpected error occurred. Please try again later.',
    recoverable: true,
  },
  {
    pattern: /502|503|504|bad gateway|service unavailable/i,
    category: 'network',
    severity: 'warning',
    message: 'Service temporarily unavailable',
    suggestion: 'The service is temporarily unavailable. Please try again in a moment.',
    recoverable: true,
  },
];

/**
 * Parse an error message and return a structured CliError
 */
export function parseCliError(errorMessage: string, errorCode?: string): CliError {
  const normalizedMessage = errorMessage.trim();

  // Check for matching patterns
  for (const pattern of ERROR_PATTERNS) {
    const regex = typeof pattern.pattern === 'string'
      ? new RegExp(pattern.pattern, 'i')
      : pattern.pattern;

    if (regex.test(normalizedMessage) || (errorCode && regex.test(errorCode))) {
      return {
        originalMessage: normalizedMessage,
        message: pattern.message,
        category: pattern.category,
        severity: pattern.severity,
        suggestion: pattern.suggestion,
        helpUrl: pattern.helpUrl,
        recoverable: pattern.recoverable,
        code: errorCode,
      };
    }
  }

  // Default unknown error
  return {
    originalMessage: normalizedMessage,
    message: 'An unexpected error occurred',
    category: 'unknown',
    severity: 'error',
    suggestion: 'Please try again. If the problem persists, check the CLI output for details.',
    recoverable: true,
    code: errorCode,
  };
}

/**
 * Parse a spawn error (ENOENT, etc.) into a CliError
 */
export function parseSpawnError(message: string, code?: string): CliError {
  return parseCliError(message, code);
}

/**
 * Format an error for display in the UI
 */
export function formatErrorForDisplay(error: CliError): string {
  let display = error.message;

  if (error.suggestion) {
    display += `\n\n${error.suggestion}`;
  }

  return display;
}

/**
 * Get icon suggestion for error category
 */
export function getErrorIcon(category: ErrorCategory): string {
  switch (category) {
    case 'cli_not_found':
      return 'terminal';
    case 'authentication':
      return 'key';
    case 'rate_limit':
      return 'clock';
    case 'network':
      return 'wifi-off';
    case 'permission':
      return 'lock';
    case 'session':
      return 'history';
    case 'timeout':
      return 'hourglass';
    case 'validation':
      return 'alert-triangle';
    case 'unknown':
    default:
      return 'alert-circle';
  }
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetry(error: CliError): boolean {
  if (!error.recoverable) {
    return false;
  }

  // Retry for transient errors
  return ['network', 'timeout', 'rate_limit'].includes(error.category);
}

/**
 * Get retry delay in milliseconds based on error type
 */
export function getRetryDelay(error: CliError, attemptNumber: number = 1): number {
  const baseDelay = error.category === 'rate_limit' ? 5000 : 1000;
  // Exponential backoff: baseDelay * 2^(attempt-1), capped at 30 seconds
  return Math.min(baseDelay * Math.pow(2, attemptNumber - 1), 30000);
}
