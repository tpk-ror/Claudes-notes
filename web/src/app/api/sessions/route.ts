// API route for session operations
// GET /api/sessions - Get all sessions
// POST /api/sessions - Create a new session

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../db';
import { migrate } from '../../../db/migrate';
import * as sessionService from '../../../services/session-service';

// Ensure database is migrated
let dbInitialized = false;
function ensureDb() {
  if (!dbInitialized) {
    migrate();
    dbInitialized = true;
  }
  return getDatabase();
}

export async function GET() {
  try {
    const db = ensureDb();
    const sessions = sessionService.getAllSessions(db);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, slug, projectPath, model } = body;

    if (!id || !slug || !projectPath) {
      return NextResponse.json(
        { error: 'id, slug, and projectPath are required' },
        { status: 400 }
      );
    }

    const db = ensureDb();
    const session = sessionService.createSession(db, {
      id,
      slug,
      projectPath,
      model,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
