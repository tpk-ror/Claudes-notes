// API route for plan operations
// GET /api/plans?sessionId=xxx - Get all plans for a session
// POST /api/plans - Create a new plan

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../db';
import { migrate } from '../../../db/migrate';
import * as planService from '../../../services/plan-service';
import type { PlanStatus } from '../../../store/types';

// Ensure database is migrated
let dbInitialized = false;
function ensureDb() {
  if (!dbInitialized) {
    migrate();
    dbInitialized = true;
  }
  return getDatabase();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    const db = ensureDb();
    const plans = planService.getPlansForSession(db, sessionId);

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, sessionId, title, content, status, tasks } = body;

    if (!id || !sessionId || !title || !content) {
      return NextResponse.json(
        { error: 'id, sessionId, title, and content are required' },
        { status: 400 }
      );
    }

    const db = ensureDb();
    const plan = planService.createPlan(db, {
      id,
      sessionId,
      title,
      content,
      status: status as PlanStatus | undefined,
      tasks,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
