// Health check API endpoint
// Checks for claude CLI availability on app startup

import { NextResponse } from 'next/server';
import { checkClaudeCliAvailable, CliCheckResult } from '@/lib/cli-check';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    claudeCli: CliCheckResult;
  };
}

/**
 * GET /api/health
 * Returns health status including claude CLI availability
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const cliCheck = checkClaudeCliAvailable();

  const status: HealthCheckResponse['status'] = cliCheck.available
    ? 'healthy'
    : 'unhealthy';

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    checks: {
      claudeCli: cliCheck,
    },
  };

  // Return 503 Service Unavailable if CLI is not available
  const httpStatus = cliCheck.available ? 200 : 503;

  return NextResponse.json(response, { status: httpStatus });
}
