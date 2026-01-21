// Plan service for database operations
// Handles CRUD operations for plans and tasks

import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import type { Plan, Task, PlanStatus, TaskStatus } from '../store/types';

type Database = BetterSQLite3Database<typeof schema>;

/**
 * Convert a database plan record to the store Plan type
 */
export function planRecordToPlan(
  record: schema.PlanRecord,
  tasks: Task[] = []
): Plan {
  return {
    id: record.id,
    sessionId: record.sessionId,
    title: record.title,
    content: record.content,
    status: record.status as PlanStatus,
    tasks,
    createdAt: record.createdAt,
    approvedAt: record.approvedAt ?? undefined,
  };
}

/**
 * Convert a database task record to the store Task type
 */
export function taskRecordToTask(record: schema.TaskRecord): Task {
  return {
    id: record.id,
    planId: record.planId,
    parentId: record.parentId ?? undefined,
    content: record.content,
    status: record.status as TaskStatus,
    sortOrder: record.sortOrder,
  };
}

/**
 * Get all plans for a session with their tasks
 */
export function getPlansForSession(db: Database, sessionId: string): Plan[] {
  const planRecords = db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.sessionId, sessionId))
    .all();

  return planRecords.map((planRecord) => {
    const taskRecords = db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.planId, planRecord.id))
      .all();

    const tasks = taskRecords.map(taskRecordToTask);
    return planRecordToPlan(planRecord, tasks);
  });
}

/**
 * Get a single plan by ID with its tasks
 */
export function getPlanById(db: Database, planId: string): Plan | undefined {
  const planRecord = db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.id, planId))
    .get();

  if (!planRecord) {
    return undefined;
  }

  const taskRecords = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.planId, planId))
    .all();

  const tasks = taskRecords.map(taskRecordToTask);
  return planRecordToPlan(planRecord, tasks);
}

/**
 * Create a new plan in the database
 */
export function createPlan(
  db: Database,
  plan: {
    id: string;
    sessionId: string;
    title: string;
    content: string;
    status?: PlanStatus;
    tasks?: Task[];
  }
): Plan {
  const now = new Date();

  db.insert(schema.plans)
    .values({
      id: plan.id,
      sessionId: plan.sessionId,
      title: plan.title,
      content: plan.content,
      status: plan.status ?? 'draft',
      createdAt: now,
    })
    .run();

  // Insert tasks if provided
  if (plan.tasks && plan.tasks.length > 0) {
    for (const task of plan.tasks) {
      db.insert(schema.tasks)
        .values({
          id: task.id,
          planId: plan.id,
          parentId: task.parentId ?? null,
          content: task.content,
          status: task.status,
          sortOrder: task.sortOrder,
        })
        .run();
    }
  }

  return {
    id: plan.id,
    sessionId: plan.sessionId,
    title: plan.title,
    content: plan.content,
    status: plan.status ?? 'draft',
    tasks: plan.tasks ?? [],
    createdAt: now,
  };
}

/**
 * Update plan status in the database
 */
export function updatePlanStatus(
  db: Database,
  planId: string,
  status: PlanStatus,
  approvedAt?: Date
): boolean {
  const result = db
    .update(schema.plans)
    .set({
      status,
      approvedAt: approvedAt ?? null,
    })
    .where(eq(schema.plans.id, planId))
    .run();

  return result.changes > 0;
}

/**
 * Approve a plan (set status to 'approved' with timestamp)
 */
export function approvePlan(db: Database, planId: string): boolean {
  return updatePlanStatus(db, planId, 'approved', new Date());
}

/**
 * Update plan content in the database
 */
export function updatePlanContent(
  db: Database,
  planId: string,
  content: string
): boolean {
  const result = db
    .update(schema.plans)
    .set({ content })
    .where(eq(schema.plans.id, planId))
    .run();

  return result.changes > 0;
}

/**
 * Delete a plan from the database
 */
export function deletePlan(db: Database, planId: string): boolean {
  const result = db
    .delete(schema.plans)
    .where(eq(schema.plans.id, planId))
    .run();

  return result.changes > 0;
}

/**
 * Update task status in the database
 */
export function updateTaskStatus(
  db: Database,
  taskId: string,
  status: TaskStatus
): boolean {
  const result = db
    .update(schema.tasks)
    .set({ status })
    .where(eq(schema.tasks.id, taskId))
    .run();

  return result.changes > 0;
}
