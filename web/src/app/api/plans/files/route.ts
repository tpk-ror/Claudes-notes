import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { PlanFileInfo } from '@/types/plan-files';
import {
  generatePlanFileName,
  parsePlanFileName,
  formatPlanDisplayName,
  isValidPlanFileName,
  parseDateFromFileName,
} from '@/lib/plan-file-utils';

// Plans are stored in /docs/plans relative to project root
const PLANS_DIR = 'docs/plans';

/**
 * Resolve the plans directory path from a project path
 * Validates to prevent directory traversal attacks
 */
function resolvePlansDir(projectPath: string): string {
  // Normalize and resolve the path
  const normalized = path.normalize(projectPath);

  // Ensure we're working with an absolute path
  const absoluteProject = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(process.cwd(), normalized);

  // Build the plans directory path
  const plansDir = path.join(absoluteProject, PLANS_DIR);

  // Verify the plans dir is within the project path (prevent traversal)
  if (!plansDir.startsWith(absoluteProject)) {
    throw new Error('Invalid project path: directory traversal detected');
  }

  return plansDir;
}

/**
 * GET /api/plans/files - List all plan files
 *
 * Query params:
 * - projectPath: Path to the project root (required)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectPath = searchParams.get('projectPath');

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    const plansDir = resolvePlansDir(projectPath);

    // Check if directory exists
    try {
      await fs.access(plansDir);
    } catch {
      // Directory doesn't exist, return empty list
      return NextResponse.json({ files: [] });
    }

    // Read directory contents
    const entries = await fs.readdir(plansDir, { withFileTypes: true });

    // Filter for .md files that match our naming convention
    const planFiles: PlanFileInfo[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        continue;
      }

      // Only include files matching our naming convention
      if (!isValidPlanFileName(entry.name)) {
        continue;
      }

      const filePath = path.join(plansDir, entry.name);
      const stats = await fs.stat(filePath);
      const parsed = parsePlanFileName(entry.name);

      planFiles.push({
        fileName: entry.name,
        displayName: formatPlanDisplayName(entry.name),
        createdAt: parsed ? parseDateFromFileName(parsed) || stats.birthtime : stats.birthtime,
        modifiedAt: stats.mtime,
        sizeBytes: stats.size,
      });
    }

    // Sort by modification date (newest first)
    planFiles.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    return NextResponse.json({ files: planFiles });
  } catch (error) {
    console.error('Error listing plan files:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list plan files' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plans/files - Create a new plan file
 *
 * Body:
 * - projectPath: Path to the project root (required)
 * - name: Plan name (required)
 * - content: Plan content (optional)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectPath, name, content = '' } = body;

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const plansDir = resolvePlansDir(projectPath);

    // Ensure directory exists
    await fs.mkdir(plansDir, { recursive: true });

    // Generate filename
    const fileName = generatePlanFileName(name);
    const filePath = path.join(plansDir, fileName);

    // Verify path is within plans dir (prevent traversal)
    if (!filePath.startsWith(plansDir)) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Check if file already exists
    try {
      await fs.access(filePath);
      return NextResponse.json(
        { error: 'File already exists' },
        { status: 409 }
      );
    } catch {
      // File doesn't exist, good to continue
    }

    // Write the file
    await fs.writeFile(filePath, content, 'utf-8');

    // Get file stats
    const stats = await fs.stat(filePath);

    const fileInfo: PlanFileInfo = {
      fileName,
      displayName: formatPlanDisplayName(fileName),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      sizeBytes: stats.size,
    };

    return NextResponse.json({ file: fileInfo }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create plan file' },
      { status: 500 }
    );
  }
}
