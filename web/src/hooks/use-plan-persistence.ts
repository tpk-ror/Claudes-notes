// React hook for plan persistence
// Synchronizes plan data between the Zustand store and the database via API

import { useCallback, useEffect, useState } from 'react';
import { usePlanStore } from '../store';
import * as planApi from '../lib/plan-api';
import type { Plan, Task, PlanStatus } from '../store/types';

export interface UsePlanPersistenceOptions {
  sessionId: string;
  autoLoad?: boolean;
}

export interface UsePlanPersistenceReturn {
  loading: boolean;
  error: string | null;
  loadPlans: () => Promise<void>;
  createPlan: (plan: {
    id: string;
    title: string;
    content: string;
    status?: PlanStatus;
    tasks?: Task[];
  }) => Promise<Plan>;
  approvePlan: (planId: string) => Promise<void>;
  updatePlanStatus: (planId: string, status: PlanStatus) => Promise<void>;
  updatePlanContent: (planId: string, content: string) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
}

/**
 * Hook that provides plan persistence with database synchronization
 *
 * This hook:
 * - Loads plans from the database on mount (if autoLoad is true)
 * - Provides methods that update both the store and the database
 * - Handles loading and error states
 */
export function usePlanPersistence(
  options: UsePlanPersistenceOptions
): UsePlanPersistenceReturn {
  const { sessionId, autoLoad = true } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storeSetPlans = usePlanStore((state) => state.setPlans);
  const storeAddPlan = usePlanStore((state) => state.addPlan);
  const storeUpdatePlan = usePlanStore((state) => state.updatePlan);
  const storeRemovePlan = usePlanStore((state) => state.removePlan);

  /**
   * Load plans from the database and update the store
   */
  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const plans = await planApi.fetchPlansForSession(sessionId);
      storeSetPlans(plans);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plans';
      setError(message);
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, storeSetPlans]);

  /**
   * Create a new plan in both the database and store
   */
  const createPlan = useCallback(
    async (plan: {
      id: string;
      title: string;
      content: string;
      status?: PlanStatus;
      tasks?: Task[];
    }): Promise<Plan> => {
      setError(null);

      try {
        const createdPlan = await planApi.createPlan({
          ...plan,
          sessionId,
        });
        storeAddPlan(createdPlan);
        return createdPlan;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create plan';
        setError(message);
        throw err;
      }
    },
    [sessionId, storeAddPlan]
  );

  /**
   * Approve a plan in both the database and store
   */
  const approvePlan = useCallback(
    async (planId: string): Promise<void> => {
      setError(null);

      try {
        const updatedPlan = await planApi.approvePlan(planId);
        storeUpdatePlan(planId, {
          status: updatedPlan.status,
          approvedAt: updatedPlan.approvedAt,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to approve plan';
        setError(message);
        throw err;
      }
    },
    [storeUpdatePlan]
  );

  /**
   * Update plan status in both the database and store
   */
  const updatePlanStatus = useCallback(
    async (planId: string, status: PlanStatus): Promise<void> => {
      setError(null);

      try {
        const updatedPlan = await planApi.updatePlanStatus(planId, status);
        storeUpdatePlan(planId, {
          status: updatedPlan.status,
          approvedAt: updatedPlan.approvedAt,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update plan status';
        setError(message);
        throw err;
      }
    },
    [storeUpdatePlan]
  );

  /**
   * Update plan content in both the database and store
   */
  const updatePlanContent = useCallback(
    async (planId: string, content: string): Promise<void> => {
      setError(null);

      try {
        const updatedPlan = await planApi.updatePlanContent(planId, content);
        storeUpdatePlan(planId, { content: updatedPlan.content });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update plan content';
        setError(message);
        throw err;
      }
    },
    [storeUpdatePlan]
  );

  /**
   * Delete a plan from both the database and store
   */
  const deletePlan = useCallback(
    async (planId: string): Promise<void> => {
      setError(null);

      try {
        await planApi.deletePlan(planId);
        storeRemovePlan(planId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete plan';
        setError(message);
        throw err;
      }
    },
    [storeRemovePlan]
  );

  // Auto-load plans on mount if enabled
  useEffect(() => {
    if (autoLoad && sessionId) {
      loadPlans();
    }
  }, [autoLoad, sessionId, loadPlans]);

  return {
    loading,
    error,
    loadPlans,
    createPlan,
    approvePlan,
    updatePlanStatus,
    updatePlanContent,
    deletePlan,
  };
}
