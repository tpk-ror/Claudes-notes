import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, HealthCheckResponse } from './route';
import * as cliCheck from '@/lib/cli-check';

// Mock the cli-check module
vi.mock('@/lib/cli-check', () => ({
  checkClaudeCliAvailable: vi.fn(),
  clearCliCheckCache: vi.fn(),
  getCachedCliCheckResult: vi.fn(),
}));

const mockCheckClaudeCliAvailable = vi.mocked(cliCheck.checkClaudeCliAvailable);

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy status when CLI is available', async () => {
    mockCheckClaudeCliAvailable.mockReturnValue({
      available: true,
      version: 'claude v1.0.0',
    });

    const response = await GET();
    const data: HealthCheckResponse = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.claudeCli.available).toBe(true);
    expect(data.checks.claudeCli.version).toBe('claude v1.0.0');
  });

  it('returns unhealthy status when CLI is not available', async () => {
    mockCheckClaudeCliAvailable.mockReturnValue({
      available: false,
      error: 'Claude CLI not found in PATH. Please install it first.',
    });

    const response = await GET();
    const data: HealthCheckResponse = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.checks.claudeCli.available).toBe(false);
    expect(data.checks.claudeCli.error).toBe('Claude CLI not found in PATH. Please install it first.');
  });

  it('includes timestamp in response', async () => {
    mockCheckClaudeCliAvailable.mockReturnValue({
      available: true,
      version: 'claude v1.0.0',
    });

    const before = new Date().toISOString();
    const response = await GET();
    const data: HealthCheckResponse = await response.json();
    const after = new Date().toISOString();

    expect(data.timestamp).toBeDefined();
    // Timestamp should be between before and after
    expect(data.timestamp >= before).toBe(true);
    expect(data.timestamp <= after).toBe(true);
  });

  it('calls checkClaudeCliAvailable', async () => {
    mockCheckClaudeCliAvailable.mockReturnValue({
      available: true,
      version: 'claude v1.0.0',
    });

    await GET();

    expect(mockCheckClaudeCliAvailable).toHaveBeenCalledTimes(1);
  });

  it('returns JSON content type', async () => {
    mockCheckClaudeCliAvailable.mockReturnValue({
      available: true,
      version: 'claude v1.0.0',
    });

    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
