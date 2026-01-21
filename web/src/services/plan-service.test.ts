import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from '../db/migrate';
import * as schema from '../db/schema';
import * as planService from './plan-service';
import type { Task } from '../store/types';

describe('Plan Service', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    // Create in-memory database for testing
    sqlite = migrate({ inMemory: true });
    db = drizzle(sqlite, { schema });

    // Create a test session for plans
    const now = new Date();
    db.insert(schema.sessions)
      .values({
        id: 'session-1',
        slug: 'test-session',
        projectPath: '/path/to/project',
        model: 'claude-3-opus',
        createdAt: now,
        lastActiveAt: now,
      })
      .run();
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('planRecordToPlan', () => {
    it('should convert a plan record to a Plan type', () => {
      const now = new Date();
      const record: schema.PlanRecord = {
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
        status: 'draft',
        createdAt: now,
        approvedAt: null,
      };

      const plan = planService.planRecordToPlan(record);

      expect(plan.id).toBe('plan-1');
      expect(plan.sessionId).toBe('session-1');
      expect(plan.title).toBe('Test Plan');
      expect(plan.content).toBe('# Plan Content');
      expect(plan.status).toBe('draft');
      expect(plan.createdAt).toEqual(now);
      expect(plan.approvedAt).toBeUndefined();
      expect(plan.tasks).toEqual([]);
    });

    it('should include tasks when provided', () => {
      const now = new Date();
      const record: schema.PlanRecord = {
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
        status: 'draft',
        createdAt: now,
        approvedAt: null,
      };

      const tasks: Task[] = [
        {
          id: 'task-1',
          planId: 'plan-1',
          content: 'Task 1',
          status: 'pending',
          sortOrder: 0,
        },
      ];

      const plan = planService.planRecordToPlan(record, tasks);

      expect(plan.tasks).toEqual(tasks);
    });

    it('should convert approvedAt from Date', () => {
      const now = new Date();
      const approved = new Date(now.getTime() + 1000);
      const record: schema.PlanRecord = {
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
        status: 'approved',
        createdAt: now,
        approvedAt: approved,
      };

      const plan = planService.planRecordToPlan(record);

      expect(plan.approvedAt).toEqual(approved);
    });
  });

  describe('taskRecordToTask', () => {
    it('should convert a task record to a Task type', () => {
      const record: schema.TaskRecord = {
        id: 'task-1',
        planId: 'plan-1',
        parentId: null,
        content: 'Test Task',
        status: 'pending',
        sortOrder: 0,
      };

      const task = planService.taskRecordToTask(record);

      expect(task.id).toBe('task-1');
      expect(task.planId).toBe('plan-1');
      expect(task.parentId).toBeUndefined();
      expect(task.content).toBe('Test Task');
      expect(task.status).toBe('pending');
      expect(task.sortOrder).toBe(0);
    });

    it('should convert parentId when present', () => {
      const record: schema.TaskRecord = {
        id: 'task-2',
        planId: 'plan-1',
        parentId: 'task-1',
        content: 'Child Task',
        status: 'in_progress',
        sortOrder: 1,
      };

      const task = planService.taskRecordToTask(record);

      expect(task.parentId).toBe('task-1');
    });
  });

  describe('createPlan', () => {
    it('should create a plan in the database', () => {
      const plan = planService.createPlan(db, {
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
      });

      expect(plan.id).toBe('plan-1');
      expect(plan.sessionId).toBe('session-1');
      expect(plan.title).toBe('Test Plan');
      expect(plan.content).toBe('# Plan Content');
      expect(plan.status).toBe('draft');
      expect(plan.tasks).toEqual([]);
      expect(plan.createdAt).toBeInstanceOf(Date);
    });

    it('should create a plan with custom status', () => {
      const plan = planService.createPlan(db, {
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
        status: 'approved',
      });

      expect(plan.status).toBe('approved');
    });

    it('should create a plan with tasks', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          planId: 'plan-1',
          content: 'Task 1',
          status: 'pending',
          sortOrder: 0,
        },
        {
          id: 'task-2',
          planId: 'plan-1',
          parentId: 'task-1',
          content: 'Task 2',
          status: 'completed',
          sortOrder: 1,
        },
      ];

      const plan = planService.createPlan(db, {
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
        tasks,
      });

      expect(plan.tasks).toEqual(tasks);

      // Verify tasks were inserted in database
      const dbTasks = db.select().from(schema.tasks).all();
      expect(dbTasks).toHaveLength(2);
    });

    it('should persist plan to database', () => {
      planService.createPlan(db, {
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
      });

      const dbPlan = db.select().from(schema.plans).all();
      expect(dbPlan).toHaveLength(1);
      expect(dbPlan[0].id).toBe('plan-1');
    });
  });

  describe('getPlanById', () => {
    it('should return a plan with its tasks', () => {
      // Create plan and tasks
      const now = new Date();
      db.insert(schema.plans)
        .values({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Test Plan',
          content: '# Plan Content',
          status: 'draft',
          createdAt: now,
        })
        .run();

      db.insert(schema.tasks)
        .values({
          id: 'task-1',
          planId: 'plan-1',
          content: 'Task 1',
          status: 'pending',
          sortOrder: 0,
        })
        .run();

      const plan = planService.getPlanById(db, 'plan-1');

      expect(plan).toBeDefined();
      expect(plan?.id).toBe('plan-1');
      expect(plan?.tasks).toHaveLength(1);
      expect(plan?.tasks[0].id).toBe('task-1');
    });

    it('should return undefined for non-existent plan', () => {
      const plan = planService.getPlanById(db, 'non-existent');
      expect(plan).toBeUndefined();
    });
  });

  describe('getPlansForSession', () => {
    it('should return all plans for a session', () => {
      const now = new Date();
      db.insert(schema.plans)
        .values([
          {
            id: 'plan-1',
            sessionId: 'session-1',
            title: 'Plan 1',
            content: '# Plan 1',
            createdAt: now,
          },
          {
            id: 'plan-2',
            sessionId: 'session-1',
            title: 'Plan 2',
            content: '# Plan 2',
            createdAt: now,
          },
        ])
        .run();

      const plans = planService.getPlansForSession(db, 'session-1');

      expect(plans).toHaveLength(2);
    });

    it('should return empty array for session with no plans', () => {
      const plans = planService.getPlansForSession(db, 'session-1');
      expect(plans).toEqual([]);
    });

    it('should include tasks for each plan', () => {
      const now = new Date();
      db.insert(schema.plans)
        .values({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Plan 1',
          content: '# Plan 1',
          createdAt: now,
        })
        .run();

      db.insert(schema.tasks)
        .values({
          id: 'task-1',
          planId: 'plan-1',
          content: 'Task 1',
          status: 'pending',
          sortOrder: 0,
        })
        .run();

      const plans = planService.getPlansForSession(db, 'session-1');

      expect(plans[0].tasks).toHaveLength(1);
    });
  });

  describe('updatePlanStatus', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.plans)
        .values({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Test Plan',
          content: '# Plan Content',
          status: 'draft',
          createdAt: now,
        })
        .run();
    });

    it('should update plan status', () => {
      const success = planService.updatePlanStatus(db, 'plan-1', 'approved');

      expect(success).toBe(true);

      const plan = planService.getPlanById(db, 'plan-1');
      expect(plan?.status).toBe('approved');
    });

    it('should update approvedAt when provided', () => {
      const approvedAt = new Date();
      const success = planService.updatePlanStatus(
        db,
        'plan-1',
        'approved',
        approvedAt
      );

      expect(success).toBe(true);

      const plan = planService.getPlanById(db, 'plan-1');
      // SQLite stores timestamps with second precision, so compare without milliseconds
      expect(plan?.approvedAt).toBeInstanceOf(Date);
      expect(Math.floor(plan!.approvedAt!.getTime() / 1000)).toEqual(
        Math.floor(approvedAt.getTime() / 1000)
      );
    });

    it('should return false for non-existent plan', () => {
      const success = planService.updatePlanStatus(
        db,
        'non-existent',
        'approved'
      );
      expect(success).toBe(false);
    });

    it('should clear approvedAt when not provided', () => {
      // First approve
      planService.updatePlanStatus(db, 'plan-1', 'approved', new Date());

      // Then change to another status without approvedAt
      planService.updatePlanStatus(db, 'plan-1', 'draft');

      const plan = planService.getPlanById(db, 'plan-1');
      expect(plan?.approvedAt).toBeUndefined();
    });
  });

  describe('approvePlan', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.plans)
        .values({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Test Plan',
          content: '# Plan Content',
          status: 'draft',
          createdAt: now,
        })
        .run();
    });

    it('should approve a plan', () => {
      const success = planService.approvePlan(db, 'plan-1');

      expect(success).toBe(true);

      const plan = planService.getPlanById(db, 'plan-1');
      expect(plan?.status).toBe('approved');
      expect(plan?.approvedAt).toBeInstanceOf(Date);
    });

    it('should return false for non-existent plan', () => {
      const success = planService.approvePlan(db, 'non-existent');
      expect(success).toBe(false);
    });
  });

  describe('updatePlanContent', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.plans)
        .values({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Test Plan',
          content: '# Original Content',
          status: 'draft',
          createdAt: now,
        })
        .run();
    });

    it('should update plan content', () => {
      const success = planService.updatePlanContent(
        db,
        'plan-1',
        '# Updated Content'
      );

      expect(success).toBe(true);

      const plan = planService.getPlanById(db, 'plan-1');
      expect(plan?.content).toBe('# Updated Content');
    });

    it('should return false for non-existent plan', () => {
      const success = planService.updatePlanContent(
        db,
        'non-existent',
        '# New Content'
      );
      expect(success).toBe(false);
    });
  });

  describe('deletePlan', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.plans)
        .values({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Test Plan',
          content: '# Plan Content',
          status: 'draft',
          createdAt: now,
        })
        .run();
    });

    it('should delete a plan', () => {
      const success = planService.deletePlan(db, 'plan-1');

      expect(success).toBe(true);

      const plan = planService.getPlanById(db, 'plan-1');
      expect(plan).toBeUndefined();
    });

    it('should return false for non-existent plan', () => {
      const success = planService.deletePlan(db, 'non-existent');
      expect(success).toBe(false);
    });

    it('should cascade delete tasks', () => {
      db.insert(schema.tasks)
        .values({
          id: 'task-1',
          planId: 'plan-1',
          content: 'Task 1',
          status: 'pending',
          sortOrder: 0,
        })
        .run();

      planService.deletePlan(db, 'plan-1');

      const tasks = db.select().from(schema.tasks).all();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('updateTaskStatus', () => {
    beforeEach(() => {
      const now = new Date();
      db.insert(schema.plans)
        .values({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Test Plan',
          content: '# Plan Content',
          status: 'draft',
          createdAt: now,
        })
        .run();

      db.insert(schema.tasks)
        .values({
          id: 'task-1',
          planId: 'plan-1',
          content: 'Task 1',
          status: 'pending',
          sortOrder: 0,
        })
        .run();
    });

    it('should update task status', () => {
      const success = planService.updateTaskStatus(db, 'task-1', 'completed');

      expect(success).toBe(true);

      const plan = planService.getPlanById(db, 'plan-1');
      expect(plan?.tasks[0].status).toBe('completed');
    });

    it('should return false for non-existent task', () => {
      const success = planService.updateTaskStatus(
        db,
        'non-existent',
        'completed'
      );
      expect(success).toBe(false);
    });
  });
});
