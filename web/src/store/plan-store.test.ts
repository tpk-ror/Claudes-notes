import { describe, it, expect, beforeEach } from 'vitest';
import { usePlanStore } from './plan-store';
import type { Plan, Task } from './types';

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  planId: 'plan-1',
  content: 'Implement feature',
  status: 'pending',
  sortOrder: 0,
  ...overrides,
});

const createMockPlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  sessionId: 'session-1',
  title: 'Test Plan',
  content: '# Implementation Plan\n\n- Task 1\n- Task 2',
  status: 'draft',
  tasks: [],
  createdAt: new Date('2026-01-19T10:00:00Z'),
  ...overrides,
});

describe('usePlanStore', () => {
  beforeEach(() => {
    usePlanStore.setState({
      plans: [],
      currentPlanId: null,
    });
  });

  describe('initial state', () => {
    it('should have empty plans array', () => {
      expect(usePlanStore.getState().plans).toEqual([]);
    });

    it('should have null currentPlanId', () => {
      expect(usePlanStore.getState().currentPlanId).toBeNull();
    });
  });

  describe('setPlans', () => {
    it('should set plans array', () => {
      const plans = [createMockPlan(), createMockPlan({ id: 'plan-2' })];
      usePlanStore.getState().setPlans(plans);
      expect(usePlanStore.getState().plans).toEqual(plans);
    });
  });

  describe('addPlan', () => {
    it('should add a plan to the array', () => {
      const plan = createMockPlan();
      usePlanStore.getState().addPlan(plan);
      expect(usePlanStore.getState().plans).toContainEqual(plan);
    });
  });

  describe('updatePlan', () => {
    it('should update a plan by id', () => {
      const plan = createMockPlan();
      usePlanStore.getState().addPlan(plan);
      usePlanStore.getState().updatePlan('plan-1', { title: 'Updated Title' });
      expect(usePlanStore.getState().plans[0].title).toBe('Updated Title');
    });
  });

  describe('removePlan', () => {
    it('should remove a plan by id', () => {
      const plan = createMockPlan();
      usePlanStore.getState().addPlan(plan);
      usePlanStore.getState().removePlan('plan-1');
      expect(usePlanStore.getState().plans).toHaveLength(0);
    });

    it('should clear currentPlanId if removed plan was current', () => {
      const plan = createMockPlan();
      usePlanStore.getState().addPlan(plan);
      usePlanStore.getState().setCurrentPlan('plan-1');
      usePlanStore.getState().removePlan('plan-1');
      expect(usePlanStore.getState().currentPlanId).toBeNull();
    });
  });

  describe('setCurrentPlan', () => {
    it('should set currentPlanId', () => {
      usePlanStore.getState().setCurrentPlan('plan-1');
      expect(usePlanStore.getState().currentPlanId).toBe('plan-1');
    });
  });

  describe('getCurrentPlan', () => {
    it('should return current plan', () => {
      const plan = createMockPlan();
      usePlanStore.getState().addPlan(plan);
      usePlanStore.getState().setCurrentPlan('plan-1');
      expect(usePlanStore.getState().getCurrentPlan()).toEqual(plan);
    });

    it('should return undefined if no current plan', () => {
      expect(usePlanStore.getState().getCurrentPlan()).toBeUndefined();
    });
  });

  describe('getPlansBySession', () => {
    it('should return plans for a specific session', () => {
      const plans = [
        createMockPlan({ id: 'plan-1', sessionId: 'session-1' }),
        createMockPlan({ id: 'plan-2', sessionId: 'session-2' }),
        createMockPlan({ id: 'plan-3', sessionId: 'session-1' }),
      ];
      usePlanStore.getState().setPlans(plans);
      const sessionPlans = usePlanStore.getState().getPlansBySession('session-1');
      expect(sessionPlans).toHaveLength(2);
    });
  });

  describe('setPlanStatus', () => {
    it('should set plan status', () => {
      const plan = createMockPlan();
      usePlanStore.getState().addPlan(plan);
      usePlanStore.getState().setPlanStatus('plan-1', 'approved');
      expect(usePlanStore.getState().plans[0].status).toBe('approved');
    });
  });

  describe('approvePlan', () => {
    it('should set status to approved and set approvedAt', () => {
      const plan = createMockPlan();
      usePlanStore.getState().addPlan(plan);
      usePlanStore.getState().approvePlan('plan-1');
      const updatedPlan = usePlanStore.getState().plans[0];
      expect(updatedPlan.status).toBe('approved');
      expect(updatedPlan.approvedAt).toBeDefined();
    });
  });

  describe('createDraftPlan', () => {
    it('should create a plan with draft status', () => {
      const plan = usePlanStore.getState().createDraftPlan({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'My Draft Plan',
        content: '# Plan Content',
      });
      expect(plan.status).toBe('draft');
    });

    it('should add the plan to the store', () => {
      usePlanStore.getState().createDraftPlan({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'My Draft Plan',
        content: '# Plan Content',
      });
      expect(usePlanStore.getState().plans).toHaveLength(1);
    });

    it('should return the created plan', () => {
      const plan = usePlanStore.getState().createDraftPlan({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'My Draft Plan',
        content: '# Plan Content',
      });
      expect(plan.id).toBe('plan-1');
      expect(plan.sessionId).toBe('session-1');
      expect(plan.title).toBe('My Draft Plan');
      expect(plan.content).toBe('# Plan Content');
    });

    it('should set createdAt to current date', () => {
      const beforeCreate = new Date();
      const plan = usePlanStore.getState().createDraftPlan({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'My Draft Plan',
        content: '# Plan Content',
      });
      const afterCreate = new Date();
      expect(plan.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(plan.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should initialize with empty tasks array by default', () => {
      const plan = usePlanStore.getState().createDraftPlan({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'My Draft Plan',
        content: '# Plan Content',
      });
      expect(plan.tasks).toEqual([]);
    });

    it('should accept tasks in input', () => {
      const tasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ];
      const plan = usePlanStore.getState().createDraftPlan({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'My Draft Plan',
        content: '# Plan Content',
        tasks,
      });
      expect(plan.tasks).toHaveLength(2);
    });

    it('should not have approvedAt set', () => {
      const plan = usePlanStore.getState().createDraftPlan({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'My Draft Plan',
        content: '# Plan Content',
      });
      expect(plan.approvedAt).toBeUndefined();
    });
  });

  describe('isDraftPlan', () => {
    it('should return true for draft plan', () => {
      const plan = createMockPlan({ status: 'draft' });
      usePlanStore.getState().addPlan(plan);
      expect(usePlanStore.getState().isDraftPlan('plan-1')).toBe(true);
    });

    it('should return false for approved plan', () => {
      const plan = createMockPlan({ status: 'approved' });
      usePlanStore.getState().addPlan(plan);
      expect(usePlanStore.getState().isDraftPlan('plan-1')).toBe(false);
    });

    it('should return false for executed plan', () => {
      const plan = createMockPlan({ status: 'executed' });
      usePlanStore.getState().addPlan(plan);
      expect(usePlanStore.getState().isDraftPlan('plan-1')).toBe(false);
    });

    it('should return false for archived plan', () => {
      const plan = createMockPlan({ status: 'archived' });
      usePlanStore.getState().addPlan(plan);
      expect(usePlanStore.getState().isDraftPlan('plan-1')).toBe(false);
    });

    it('should return false for non-existent plan', () => {
      expect(usePlanStore.getState().isDraftPlan('non-existent')).toBe(false);
    });
  });

  describe('task actions', () => {
    describe('addTaskToPlan', () => {
      it('should add a task to a plan', () => {
        const plan = createMockPlan();
        const task = createMockTask();
        usePlanStore.getState().addPlan(plan);
        usePlanStore.getState().addTaskToPlan('plan-1', task);
        expect(usePlanStore.getState().plans[0].tasks).toContainEqual(task);
      });
    });

    describe('updateTask', () => {
      it('should update a task by id', () => {
        const task = createMockTask();
        const plan = createMockPlan({ tasks: [task] });
        usePlanStore.getState().addPlan(plan);
        usePlanStore.getState().updateTask('plan-1', 'task-1', { content: 'Updated content' });
        expect(usePlanStore.getState().plans[0].tasks[0].content).toBe('Updated content');
      });
    });

    describe('setTaskStatus', () => {
      it('should set task status', () => {
        const task = createMockTask();
        const plan = createMockPlan({ tasks: [task] });
        usePlanStore.getState().addPlan(plan);
        usePlanStore.getState().setTaskStatus('plan-1', 'task-1', 'completed');
        expect(usePlanStore.getState().plans[0].tasks[0].status).toBe('completed');
      });
    });

    describe('removeTask', () => {
      it('should remove a task from a plan', () => {
        const task = createMockTask();
        const plan = createMockPlan({ tasks: [task] });
        usePlanStore.getState().addPlan(plan);
        usePlanStore.getState().removeTask('plan-1', 'task-1');
        expect(usePlanStore.getState().plans[0].tasks).toHaveLength(0);
      });
    });

    describe('getTasksByPlan', () => {
      it('should return tasks for a plan', () => {
        const tasks = [createMockTask({ id: 'task-1' }), createMockTask({ id: 'task-2' })];
        const plan = createMockPlan({ tasks });
        usePlanStore.getState().addPlan(plan);
        expect(usePlanStore.getState().getTasksByPlan('plan-1')).toHaveLength(2);
      });

      it('should return empty array for non-existent plan', () => {
        expect(usePlanStore.getState().getTasksByPlan('non-existent')).toEqual([]);
      });
    });

    describe('getPlanProgress', () => {
      it('should return 0 for plan with no tasks', () => {
        const plan = createMockPlan({ tasks: [] });
        usePlanStore.getState().addPlan(plan);
        expect(usePlanStore.getState().getPlanProgress('plan-1')).toBe(0);
      });

      it('should return correct percentage', () => {
        const tasks = [
          createMockTask({ id: 'task-1', status: 'completed' }),
          createMockTask({ id: 'task-2', status: 'completed' }),
          createMockTask({ id: 'task-3', status: 'pending' }),
          createMockTask({ id: 'task-4', status: 'in_progress' }),
        ];
        const plan = createMockPlan({ tasks });
        usePlanStore.getState().addPlan(plan);
        expect(usePlanStore.getState().getPlanProgress('plan-1')).toBe(50);
      });

      it('should return 100 when all tasks are completed', () => {
        const tasks = [
          createMockTask({ id: 'task-1', status: 'completed' }),
          createMockTask({ id: 'task-2', status: 'completed' }),
        ];
        const plan = createMockPlan({ tasks });
        usePlanStore.getState().addPlan(plan);
        expect(usePlanStore.getState().getPlanProgress('plan-1')).toBe(100);
      });
    });
  });
});
