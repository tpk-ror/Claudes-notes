import { create } from 'zustand';
import type { Plan, Task, PlanStatus, TaskStatus } from './types';

interface PlanState {
  plans: Plan[];
  currentPlanId: string | null;
}

/**
 * Input for creating a new draft plan
 */
export interface CreateDraftPlanInput {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  tasks?: Task[];
}

interface PlanActions {
  setPlans: (plans: Plan[]) => void;
  addPlan: (plan: Plan) => void;
  createDraftPlan: (input: CreateDraftPlanInput) => Plan;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  removePlan: (id: string) => void;
  setCurrentPlan: (id: string | null) => void;
  getCurrentPlan: () => Plan | undefined;
  getPlansBySession: (sessionId: string) => Plan[];
  setPlanStatus: (id: string, status: PlanStatus) => void;
  approvePlan: (id: string) => void;
  isDraftPlan: (id: string) => boolean;

  // Task actions
  addTaskToPlan: (planId: string, task: Task) => void;
  updateTask: (planId: string, taskId: string, updates: Partial<Task>) => void;
  setTaskStatus: (planId: string, taskId: string, status: TaskStatus) => void;
  removeTask: (planId: string, taskId: string) => void;
  getTasksByPlan: (planId: string) => Task[];
  getPlanProgress: (planId: string) => number;
}

export type PlanStore = PlanState & PlanActions;

export const usePlanStore = create<PlanStore>((set, get) => ({
  plans: [],
  currentPlanId: null,

  setPlans: (plans) => set({ plans }),

  addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),

  createDraftPlan: (input) => {
    const draftPlan: Plan = {
      id: input.id,
      sessionId: input.sessionId,
      title: input.title,
      content: input.content,
      status: 'draft',
      tasks: input.tasks || [],
      createdAt: new Date(),
    };
    set((state) => ({ plans: [...state.plans, draftPlan] }));
    return draftPlan;
  },

  updatePlan: (id, updates) =>
    set((state) => ({
      plans: state.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removePlan: (id) =>
    set((state) => ({
      plans: state.plans.filter((p) => p.id !== id),
      currentPlanId: state.currentPlanId === id ? null : state.currentPlanId,
    })),

  setCurrentPlan: (id) => set({ currentPlanId: id }),

  getCurrentPlan: () => {
    const state = get();
    return state.plans.find((p) => p.id === state.currentPlanId);
  },

  getPlansBySession: (sessionId) => {
    return get().plans.filter((p) => p.sessionId === sessionId);
  },

  setPlanStatus: (id, status) =>
    set((state) => ({
      plans: state.plans.map((p) => (p.id === id ? { ...p, status } : p)),
    })),

  approvePlan: (id) =>
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === id ? { ...p, status: 'approved', approvedAt: new Date() } : p
      ),
    })),

  isDraftPlan: (id) => {
    const plan = get().plans.find((p) => p.id === id);
    return plan?.status === 'draft';
  },

  addTaskToPlan: (planId, task) =>
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId ? { ...p, tasks: [...p.tasks, task] } : p
      ),
    })),

  updateTask: (planId, taskId, updates) =>
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
            }
          : p
      ),
    })),

  setTaskStatus: (planId, taskId, status) =>
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, status } : t
              ),
            }
          : p
      ),
    })),

  removeTask: (planId, taskId) =>
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          : p
      ),
    })),

  getTasksByPlan: (planId) => {
    const plan = get().plans.find((p) => p.id === planId);
    return plan?.tasks || [];
  },

  getPlanProgress: (planId) => {
    const tasks = get().getTasksByPlan(planId);
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  },
}));
