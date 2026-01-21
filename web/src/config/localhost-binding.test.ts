import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('Localhost Binding Configuration (NFR-4.5)', () => {
  // Use import.meta.url for ESM compatibility
  const currentDir = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = join(currentDir, '../..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  describe('package.json scripts', () => {
    it('should have dev script with -H 127.0.0.1 flag', () => {
      expect(packageJson.scripts.dev).toContain('-H 127.0.0.1');
    });

    it('should have start script with -H 127.0.0.1 flag', () => {
      expect(packageJson.scripts.start).toContain('-H 127.0.0.1');
    });

    it('should bind dev server to localhost only', () => {
      const devScript = packageJson.scripts.dev;
      // Verify it uses next dev with localhost binding
      expect(devScript).toMatch(/next dev.*-H 127\.0\.0\.1/);
    });

    it('should bind production server to localhost only', () => {
      const startScript = packageJson.scripts.start;
      // Verify it uses next start with localhost binding
      expect(startScript).toMatch(/next start.*-H 127\.0\.0\.1/);
    });

    it('should not bind to 0.0.0.0 (all interfaces)', () => {
      // Ensure we're not accidentally exposing to all network interfaces
      expect(packageJson.scripts.dev).not.toContain('0.0.0.0');
      expect(packageJson.scripts.start).not.toContain('0.0.0.0');
    });

    it('should not use wildcard hostname', () => {
      // Ensure we're not using :: or * which would also expose to network
      expect(packageJson.scripts.dev).not.toMatch(/-H\s*(::|[*])/);
      expect(packageJson.scripts.start).not.toMatch(/-H\s*(::|[*])/);
    });
  });

  describe('security requirements', () => {
    it('should have localhost as the only hostname for dev', () => {
      const devScript = packageJson.scripts.dev;
      // Extract the hostname value after -H flag
      const hostnameMatch = devScript.match(/-H\s+(\S+)/);
      expect(hostnameMatch).not.toBeNull();
      expect(hostnameMatch![1]).toBe('127.0.0.1');
    });

    it('should have localhost as the only hostname for start', () => {
      const startScript = packageJson.scripts.start;
      // Extract the hostname value after -H flag
      const hostnameMatch = startScript.match(/-H\s+(\S+)/);
      expect(hostnameMatch).not.toBeNull();
      expect(hostnameMatch![1]).toBe('127.0.0.1');
    });
  });
});
