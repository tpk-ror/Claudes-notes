// API route for individual plan operations
// GET /api/plans/[id] - Get a plan by ID
// PATCH /api/plans/[id] - Update a plan (status, content)
// DELETE /api/plans/[id] - Delete a plan

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../../db';
import { migrate } from '../../../../db/migrate';
import * as planService from '../../../../services/plan-service';
import type { PlanStatus } from '../../../../store/types';

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
    const plan = planService.getPlanById(db, id);

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, content, approve } = body;

    const db = ensureDb();

    // Check if plan exists
    const existingPlan = planService.getPlanById(db, id);
    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Handle approve action
    if (approve === true) {
      const success = planService.approvePlan(db, id);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to approve plan' },
          { status: 500 }
        );
      }
      const updatedPlan = planService.getPlanById(db, id);
      return NextResponse.json({ plan: updatedPlan });
    }

    // Handle status update
    if (status) {
      const success = planService.updatePlanStatus(
        db,
        id,
        status as PlanStatus
      );
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update plan status' },
          { status: 500 }
        );
      }
    }

    // Handle content update
    if (content !== undefined) {
      const success = planService.updatePlanContent(db, id, content);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update plan content' },
          { status: 500 }
        );
      }
    }

    const updatedPlan = planService.getPlanById(db, id);
    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = ensureDb();

    const success = planService.deletePlan(db, id);
    if (!success) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
