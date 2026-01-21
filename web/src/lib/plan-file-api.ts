// Client-side API functions for plan file operations
// These functions call the API routes for file-based plan storage

import type { PlanFileInfo } from '@/types/plan-files';

const API_BASE = '/api/plans/files';

/**
 * List all plan files in a project
 */
export async function listPlanFiles(projectPath: string): Promise<PlanFileInfo[]> {
  const response = await fetch(
    `${API_BASE}?projectPath=${encodeURIComponent(projectPath)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list plan files');
  }

  const data = await response.json();

  // Convert date strings back to Date objects
  return data.files.map(parsePlanFileDates);
}

/**
 * Read a plan file's content
 */
export async function readPlanFile(
  projectPath: string,
  fileName: string
): Promise<{ file: PlanFileInfo; content: string }> {
  const response = await fetch(
    `${API_BASE}/${encodeURIComponent(fileName)}?projectPath=${encodeURIComponent(projectPath)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to read plan file');
  }

  const data = await response.json();

  return {
    file: parsePlanFileDates(data.file),
    content: data.content,
  };
}

/**
 * Create a new plan file
 */
export async function createPlanFile(
  projectPath: string,
  name: string,
  content: string = ''
): Promise<PlanFileInfo> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectPath, name, content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create plan file');
  }

  const data = await response.json();
  return parsePlanFileDates(data.file);
}

/**
 * Write/update a plan file's content
 */
export async function writePlanFile(
  projectPath: string,
  fileName: string,
  content: string
): Promise<PlanFileInfo> {
  const response = await fetch(
    `${API_BASE}/${encodeURIComponent(fileName)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectPath, content }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to write plan file');
  }

  const data = await response.json();
  return parsePlanFileDates(data.file);
}

/**
 * Delete a plan file
 */
export async function deletePlanFile(
  projectPath: string,
  fileName: string
): Promise<boolean> {
  const response = await fetch(
    `${API_BASE}/${encodeURIComponent(fileName)}?projectPath=${encodeURIComponent(projectPath)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete plan file');
  }

  const data = await response.json();
  return data.success;
}

/**
 * Parse date strings in a PlanFileInfo back to Date objects
 */
function parsePlanFileDates(file: PlanFileInfo): PlanFileInfo {
  return {
    ...file,
    createdAt: new Date(file.createdAt),
    modifiedAt: new Date(file.modifiedAt),
  };
}
