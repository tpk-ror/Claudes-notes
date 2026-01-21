// Session utility functions for creating and managing sessions

import type { Session } from '../store/types';

/**
 * Generate a UUID v4 using the Web Crypto API
 * Falls back to a polyfill implementation for older environments
 */
export function generateUUID(): string {
  // Use crypto.randomUUID() if available (modern browsers and Node.js 16+)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback implementation using crypto.getRandomValues()
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version (4) and variant (RFC 4122)
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC 4122

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last resort fallback using Math.random() (not cryptographically secure)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate that a string is a valid UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a URL-friendly slug from a string
 * Used for human-readable session identifiers
 */
export function generateSlug(input: string, maxLength = 50): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}

/**
 * Generate a timestamp-based slug for sessions
 * Format: session-YYYYMMDD-HHMMSS
 */
export function generateSessionSlug(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `session-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Input for creating a new session
 */
export interface CreateSessionInput {
  projectPath: string;
  model?: string;
  slug?: string;
}

/**
 * Create a new session with a generated UUID
 */
export function createNewSession(input: CreateSessionInput): Session {
  const now = new Date();
  const id = generateUUID();

  return {
    id,
    slug: input.slug || generateSessionSlug(now),
    projectPath: input.projectPath,
    model: input.model || 'claude-sonnet-4-20250514',
    createdAt: now,
    lastActiveAt: now,
    messageCount: 0,
    totalCostUsd: '0.00',
  };
}

/**
 * Extract the project name from a project path for display
 */
export function getProjectNameFromPath(projectPath: string): string {
  // Handle both Unix and Windows paths
  const parts = projectPath.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] || projectPath;
}
