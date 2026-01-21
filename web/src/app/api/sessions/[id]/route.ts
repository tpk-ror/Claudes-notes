// API route for individual session operations
// GET /api/sessions/[id] - Get a session by ID
// PATCH /api/sessions/[id] - Update a session
// DELETE /api/sessions/[id] - Delete a session

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../db';
import { migrate } from '../../../../db/migrate';
import * as sessionService from '../../../../services/session-service';

// Ensure database is migrated
let dbInitialized = false;
function ensureDb() {
  if (!dbInitialized) {
    migrate();
    dbInitialized = true;
  }
  return getDatabase();
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = ensureDb();
    const session = sessionService.getSessionById(db, id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { touch, slug, model, lastActiveAt, messageCount, totalCostUsd, cliSessionId } = body;

    const db = ensureDb();

    // Check if session exists
    const existingSession = sessionService.getSessionById(db, id);
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Handle touch action (update lastActiveAt only)
    if (touch === true) {
      const success = sessionService.touchSession(db, id);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to touch session' },
          { status: 500 }
        );
      }
      const updatedSession = sessionService.getSessionById(db, id);
      return NextResponse.json({ session: updatedSession });
    }

    // Handle field updates
    const updates: Record<string, unknown> = {};
    if (slug !== undefined) updates.slug = slug;
    if (model !== undefined) updates.model = model;
    if (lastActiveAt !== undefined) updates.lastActiveAt = new Date(lastActiveAt);
    if (messageCount !== undefined) updates.messageCount = messageCount;
    if (totalCostUsd !== undefined) updates.totalCostUsd = totalCostUsd;
    if (cliSessionId !== undefined) updates.cliSessionId = cliSessionId;

    if (Object.keys(updates).length > 0) {
      const success = sessionService.updateSession(db, id, updates);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update session' },
          { status: 500 }
        );
      }
    }

    const updatedSession = sessionService.getSessionById(db, id);
    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = ensureDb();

    const success = sessionService.deleteSession(db, id);
    if (!success) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
