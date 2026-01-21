import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { PlanFileInfo } from '@/types/plan-files';
import {
  formatPlanDisplayName,
  isValidPlanFileName,
  parsePlanFileName,
  parseDateFromFileName,
} from '@/lib/plan-file-utils';

// Plans are stored in /docs/plans relative to project root
const PLANS_DIR = 'docs/plans';

/**
 * Resolve and validate a plan file path
 * Prevents directory traversal attacks
 */
function resolvePlanFilePath(projectPath: string, fileName: string): string {
  // Validate filename format
  if (!isValidPlanFileName(fileName)) {
    throw new Error('Invalid plan filename format');
  }

  // Normalize paths
  const normalizedProject = path.normalize(projectPath);
  const absoluteProject = path.isAbsolute(normalizedProject)
    ? normalizedProject
    : path.resolve(process.cwd(), normalizedProject);

  const plansDir = path.join(absoluteProject, PLANS_DIR);
  const filePath = path.join(plansDir, fileName);

  // Verify path is within plans dir (prevent traversal)
  if (!filePath.startsWith(plansDir)) {
    throw new Error('Invalid filename: directory traversal detected');
  }

  return filePath;
}

interface RouteParams {
  params: Promise<{ filename: string }>;
}

/**
 * GET /api/plans/files/[filename] - Read a plan file
 *
 * Query params:
 * - projectPath: Path to the project root (required)
 */
export async function GET(request: Request, context: RouteParams) {
  try {
    const { filename } = await context.params;
    const { searchParams } = new URL(request.url);
    const projectPath = searchParams.get('projectPath');

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    const filePath = resolvePlanFilePath(projectPath, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file content and stats
    const [content, stats] = await Promise.all([
      fs.readFile(filePath, 'utf-8'),
      fs.stat(filePath),
    ]);

    const parsed = parsePlanFileName(filename);

    const fileInfo: PlanFileInfo = {
      fileName: filename,
      displayName: formatPlanDisplayName(filename),
      createdAt: parsed ? parseDateFromFileName(parsed) || stats.birthtime : stats.birthtime,
      modifiedAt: stats.mtime,
      sizeBytes: stats.size,
    };

    return NextResponse.json({ file: fileInfo, content });
  } catch (error) {
    console.error('Error reading plan file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read plan file' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/plans/files/[filename] - Update a plan file
 *
 * Body:
 * - projectPath: Path to the project root (required)
 * - content: New content for the file (required)
 */
export async function PUT(request: Request, context: RouteParams) {
  try {
    const { filename } = await context.params;
    const body = await request.json();
    const { projectPath, content } = body;

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    if (content === undefined) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    const filePath = resolvePlanFilePath(projectPath, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Write updated content
    await fs.writeFile(filePath, content, 'utf-8');

    // Get updated stats
    const stats = await fs.stat(filePath);
    const parsed = parsePlanFileName(filename);

    const fileInfo: PlanFileInfo = {
      fileName: filename,
      displayName: formatPlanDisplayName(filename),
      createdAt: parsed ? parseDateFromFileName(parsed) || stats.birthtime : stats.birthtime,
      modifiedAt: stats.mtime,
      sizeBytes: stats.size,
    };

    return NextResponse.json({ file: fileInfo });
  } catch (error) {
    console.error('Error updating plan file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update plan file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plans/files/[filename] - Delete a plan file
 *
 * Query params:
 * - projectPath: Path to the project root (required)
 */
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { filename } = await context.params;
    const { searchParams } = new URL(request.url);
    const projectPath = searchParams.get('projectPath');

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    const filePath = resolvePlanFilePath(projectPath, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete the file
    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete plan file' },
      { status: 500 }
    );
  }
}
