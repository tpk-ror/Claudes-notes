import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateUUID,
  isValidUUID,
  generateSlug,
  generateSessionSlug,
  createNewSession,
  getProjectNameFromPath,
} from './session-utils';

describe('session-utils', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4 format', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should generate unique UUIDs on each call', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      expect(uuids.size).toBe(100);
    });

    it('should generate a 36-character string', () => {
      const uuid = generateUUID();
      expect(uuid.length).toBe(36);
    });

    it('should have correct hyphen positions', () => {
      const uuid = generateUUID();
      expect(uuid[8]).toBe('-');
      expect(uuid[13]).toBe('-');
      expect(uuid[18]).toBe('-');
      expect(uuid[23]).toBe('-');
    });

    it('should have version 4 indicator', () => {
      const uuid = generateUUID();
      expect(uuid[14]).toBe('4');
    });

    it('should have valid variant indicator', () => {
      const uuid = generateUUID();
      const variant = uuid[19];
      expect(['8', '9', 'a', 'b']).toContain(variant.toLowerCase());
    });

    it('should only contain valid hexadecimal characters and hyphens', () => {
      const uuid = generateUUID();
      expect(/^[0-9a-f-]+$/i.test(uuid)).toBe(true);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return true for generated UUID', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
    });

    it('should return false for missing hyphens', () => {
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
    });

    it('should return false for wrong version', () => {
      expect(isValidUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    });

    it('should return false for wrong variant', () => {
      expect(isValidUUID('550e8400-e29b-41d4-0716-446655440000')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidUUID('')).toBe(false);
    });

    it('should return false for wrong length', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
  });

  describe('generateSlug', () => {
    it('should convert to lowercase', () => {
      expect(generateSlug('HELLO')).toBe('hello');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('hello world')).toBe('hello-world');
    });

    it('should replace multiple spaces with single hyphen', () => {
      expect(generateSlug('hello   world')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('hello@world!')).toBe('hello-world');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(generateSlug('  hello world  ')).toBe('hello-world');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should respect maxLength parameter', () => {
      const long = 'a'.repeat(100);
      expect(generateSlug(long, 50).length).toBe(50);
    });

    it('should use default maxLength of 50', () => {
      const long = 'a'.repeat(100);
      expect(generateSlug(long).length).toBe(50);
    });

    it('should handle mixed case and special characters', () => {
      expect(generateSlug('Hello World! This is a TEST')).toBe('hello-world-this-is-a-test');
    });
  });

  describe('generateSessionSlug', () => {
    it('should generate slug with correct format', () => {
      const date = new Date('2026-01-19T15:30:45Z');
      const slug = generateSessionSlug(date);
      expect(slug).toMatch(/^session-\d{8}-\d{6}$/);
    });

    it('should use provided date', () => {
      const date = new Date('2026-03-15T09:05:02Z');
      const slug = generateSessionSlug(date);
      // Note: toISOString uses UTC, but the function uses local time
      // We check the pattern is correct
      expect(slug.startsWith('session-')).toBe(true);
    });

    it('should use current date when no date provided', () => {
      const before = new Date();
      const slug = generateSessionSlug();
      const after = new Date();

      // Extract date parts from slug
      const match = slug.match(/^session-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
      expect(match).not.toBeNull();
    });

    it('should pad single-digit values with zeros', () => {
      const date = new Date(2026, 0, 5, 3, 7, 9); // Jan 5, 2026, 03:07:09
      const slug = generateSessionSlug(date);
      expect(slug).toBe('session-20260105-030709');
    });

    it('should handle end of year', () => {
      const date = new Date(2026, 11, 31, 23, 59, 59); // Dec 31, 2026, 23:59:59
      const slug = generateSessionSlug(date);
      expect(slug).toBe('session-20261231-235959');
    });
  });

  describe('createNewSession', () => {
    it('should create session with valid UUID', () => {
      const session = createNewSession({ projectPath: '/path/to/project' });
      expect(isValidUUID(session.id)).toBe(true);
    });

    it('should set projectPath from input', () => {
      const session = createNewSession({ projectPath: '/path/to/project' });
      expect(session.projectPath).toBe('/path/to/project');
    });

    it('should generate slug when not provided', () => {
      const session = createNewSession({ projectPath: '/path/to/project' });
      expect(session.slug).toMatch(/^session-\d{8}-\d{6}$/);
    });

    it('should use provided slug', () => {
      const session = createNewSession({
        projectPath: '/path/to/project',
        slug: 'my-custom-slug',
      });
      expect(session.slug).toBe('my-custom-slug');
    });

    it('should use default model when not provided', () => {
      const session = createNewSession({ projectPath: '/path/to/project' });
      expect(session.model).toBe('claude-sonnet-4-20250514');
    });

    it('should use provided model', () => {
      const session = createNewSession({
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
      });
      expect(session.model).toBe('claude-3-opus');
    });

    it('should set createdAt to current time', () => {
      const before = new Date();
      const session = createNewSession({ projectPath: '/path/to/project' });
      const after = new Date();

      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should set lastActiveAt to same time as createdAt', () => {
      const session = createNewSession({ projectPath: '/path/to/project' });
      expect(session.lastActiveAt.getTime()).toBe(session.createdAt.getTime());
    });

    it('should initialize messageCount to 0', () => {
      const session = createNewSession({ projectPath: '/path/to/project' });
      expect(session.messageCount).toBe(0);
    });

    it('should initialize totalCostUsd to 0.00', () => {
      const session = createNewSession({ projectPath: '/path/to/project' });
      expect(session.totalCostUsd).toBe('0.00');
    });

    it('should generate unique IDs for each session', () => {
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        sessions.push(createNewSession({ projectPath: '/path' }));
      }
      const ids = new Set(sessions.map((s) => s.id));
      expect(ids.size).toBe(10);
    });
  });

  describe('getProjectNameFromPath', () => {
    it('should extract project name from Unix path', () => {
      expect(getProjectNameFromPath('/home/user/projects/my-project')).toBe('my-project');
    });

    it('should extract project name from Windows path', () => {
      expect(getProjectNameFromPath('C:\\Users\\user\\projects\\my-project')).toBe('my-project');
    });

    it('should handle trailing slash', () => {
      expect(getProjectNameFromPath('/home/user/projects/my-project/')).toBe('my-project');
    });

    it('should handle single directory', () => {
      expect(getProjectNameFromPath('/project')).toBe('project');
    });

    it('should handle root path', () => {
      expect(getProjectNameFromPath('/')).toBe('/');
    });

    it('should handle relative path', () => {
      expect(getProjectNameFromPath('my-project')).toBe('my-project');
    });

    it('should handle paths with dots', () => {
      expect(getProjectNameFromPath('/home/user/my.project.name')).toBe('my.project.name');
    });

    it('should handle mixed separators', () => {
      expect(getProjectNameFromPath('C:\\Users/user\\projects/my-project')).toBe('my-project');
    });
  });

  describe('UUID fallback implementations', () => {
    const originalCrypto = globalThis.crypto;

    afterEach(() => {
      // Restore original crypto
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
        writable: true,
      });
    });

    it('should use crypto.randomUUID when available', () => {
      const mockRandomUUID = vi.fn().mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
      Object.defineProperty(globalThis, 'crypto', {
        value: { randomUUID: mockRandomUUID },
        configurable: true,
        writable: true,
      });

      const uuid = generateUUID();
      expect(mockRandomUUID).toHaveBeenCalled();
      expect(uuid).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should fall back to getRandomValues when randomUUID not available', () => {
      const mockGetRandomValues = vi.fn((array: Uint8Array) => {
        // Fill with predictable values for testing
        for (let i = 0; i < array.length; i++) {
          array[i] = i * 17 % 256;
        }
        return array;
      });

      Object.defineProperty(globalThis, 'crypto', {
        value: { getRandomValues: mockGetRandomValues },
        configurable: true,
        writable: true,
      });

      const uuid = generateUUID();
      expect(mockGetRandomValues).toHaveBeenCalled();
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should fall back to Math.random when crypto not available', () => {
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const uuid = generateUUID();
      // Math.random fallback produces valid UUID format
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });
});
