// CLI spawn utility with test injection support
import { spawn, type ChildProcess, type SpawnOptions } from 'child_process';

export type SpawnFn = typeof spawn;

// The current spawn function - can be replaced for testing
let spawnFunction: SpawnFn = spawn;

/**
 * Get the current spawn function
 */
export function getSpawnFunction(): SpawnFn {
  return spawnFunction;
}

/**
 * Set a custom spawn function (for testing)
 */
export function setSpawnFunction(fn: SpawnFn): void {
  spawnFunction = fn;
}

/**
 * Reset to the default spawn function
 */
export function resetSpawnFunction(): void {
  spawnFunction = spawn;
}

/**
 * Spawn a process using the current spawn function
 */
export function spawnProcess(
  command: string,
  args: readonly string[],
  options: SpawnOptions
): ChildProcess {
  return spawnFunction(command, args, options);
}
