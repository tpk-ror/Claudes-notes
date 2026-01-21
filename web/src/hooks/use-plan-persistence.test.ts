import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlanPersistence } from './use-plan-persistence';
import { usePlanStore } from '../store';
import * as planApi from '../lib/plan-api';
import type { Plan } from '../store/types';

// Mock the plan API module
vi.mock('../lib/plan-api', () => ({
  fetchPlansForSession: vi.fn(),
  fetchPlanById: vi.fn(),
  createPlan: vi.fn(),
  approvePlan: vi.fn(),
  updatePlanStatus: vi.fn(),
  updatePlanContent: vi.fn(),
  deletePlan: vi.fn(),
}));

describe('usePlanPersistence', () => {
  const mockPlan: Plan = {
    id: 'plan-1',
    sessionId: 'session-1',
    title: 'Test Plan',
    content: '# Plan Content',
    status: 'draft',
    tasks: [],
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    // Reset the store before each test
    usePlanStore.getState().setPlans([]);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should return initial state', () => {
      vi.mocked(planApi.fetchPlansForSession).mockResolvedValueOnce([]);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should auto-load plans on mount when autoLoad is true', async () => {
      vi.mocked(planApi.fetchPlansForSession).mockResolvedValueOnce([mockPlan]);

      renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: true })
      );

      await waitFor(() => {
        expect(planApi.fetchPlansForSession).toHaveBeenCalledWith('session-1');
      });

      expect(usePlanStore.getState().plans).toHaveLength(1);
    });

    it('should not auto-load when autoLoad is false', async () => {
      vi.mocked(planApi.fetchPlansForSession).mockResolvedValueOnce([]);

      renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      // Wait a bit to ensure fetch is not called
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(planApi.fetchPlansForSession).not.toHaveBeenCalled();
    });

    it('should default to autoLoad true', async () => {
      vi.mocked(planApi.fetchPlansForSession).mockResolvedValueOnce([]);

      renderHook(() => usePlanPersistence({ sessionId: 'session-1' }));

      await waitFor(() => {
        expect(planApi.fetchPlansForSession).toHaveBeenCalledWith('session-1');
      });
    });
  });

  describe('loadPlans', () => {
    it('should load plans and update store', async () => {
      vi.mocked(planApi.fetchPlansForSession).mockResolvedValueOnce([mockPlan]);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        await result.current.loadPlans();
      });

      expect(usePlanStore.getState().plans).toEqual([mockPlan]);
    });

    it('should set loading state while loading', async () => {
      vi.mocked(planApi.fetchPlansForSession).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      act(() => {
        result.current.loadPlans();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set error state on failure', async () => {
      vi.mocked(planApi.fetchPlansForSession).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        await result.current.loadPlans();
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should clear error state on successful load', async () => {
      vi.mocked(planApi.fetchPlansForSession)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([]);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        await result.current.loadPlans();
      });

      expect(result.current.error).toBe('Network error');

      await act(async () => {
        await result.current.loadPlans();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('createPlan', () => {
    it('should create plan in API and store', async () => {
      vi.mocked(planApi.createPlan).mockResolvedValueOnce(mockPlan);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      let createdPlan: Plan | undefined;
      await act(async () => {
        createdPlan = await result.current.createPlan({
          id: 'plan-1',
          title: 'Test Plan',
          content: '# Plan Content',
        });
      });

      expect(planApi.createPlan).toHaveBeenCalledWith({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
      });
      expect(createdPlan).toEqual(mockPlan);
      expect(usePlanStore.getState().plans).toContainEqual(mockPlan);
    });

    it('should set error state on failure', async () => {
      vi.mocked(planApi.createPlan).mockRejectedValueOnce(
        new Error('Create failed')
      );

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        try {
          await result.current.createPlan({
            id: 'plan-1',
            title: 'Test Plan',
            content: '# Plan Content',
          });
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Create failed');
    });
  });

  describe('approvePlan', () => {
    it('should approve plan in API and update store', async () => {
      const approvedPlan: Plan = {
        ...mockPlan,
        status: 'approved',
        approvedAt: new Date('2024-01-02'),
      };

      vi.mocked(planApi.approvePlan).mockResolvedValueOnce(approvedPlan);

      // Pre-populate store with the draft plan
      usePlanStore.getState().addPlan(mockPlan);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        await result.current.approvePlan('plan-1');
      });

      expect(planApi.approvePlan).toHaveBeenCalledWith('plan-1');

      const storedPlan = usePlanStore.getState().plans.find((p) => p.id === 'plan-1');
      expect(storedPlan?.status).toBe('approved');
      expect(storedPlan?.approvedAt).toEqual(new Date('2024-01-02'));
    });

    it('should set error state on failure', async () => {
      vi.mocked(planApi.approvePlan).mockRejectedValueOnce(
        new Error('Approve failed')
      );

      usePlanStore.getState().addPlan(mockPlan);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        try {
          await result.current.approvePlan('plan-1');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Approve failed');
    });
  });

  describe('updatePlanStatus', () => {
    it('should update plan status in API and store', async () => {
      const executedPlan: Plan = {
        ...mockPlan,
        status: 'executed',
      };

      vi.mocked(planApi.updatePlanStatus).mockResolvedValueOnce(executedPlan);

      usePlanStore.getState().addPlan(mockPlan);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        await result.current.updatePlanStatus('plan-1', 'executed');
      });

      expect(planApi.updatePlanStatus).toHaveBeenCalledWith('plan-1', 'executed');

      const storedPlan = usePlanStore.getState().plans.find((p) => p.id === 'plan-1');
      expect(storedPlan?.status).toBe('executed');
    });

    it('should set error state on failure', async () => {
      vi.mocked(planApi.updatePlanStatus).mockRejectedValueOnce(
        new Error('Update failed')
      );

      usePlanStore.getState().addPlan(mockPlan);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        try {
          await result.current.updatePlanStatus('plan-1', 'executed');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('updatePlanContent', () => {
    it('should update plan content in API and store', async () => {
      const updatedPlan: Plan = {
        ...mockPlan,
        content: '# Updated Content',
      };

      vi.mocked(planApi.updatePlanContent).mockResolvedValueOnce(updatedPlan);

      usePlanStore.getState().addPlan(mockPlan);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        await result.current.updatePlanContent('plan-1', '# Updated Content');
      });

      expect(planApi.updatePlanContent).toHaveBeenCalledWith(
        'plan-1',
        '# Updated Content'
      );

      const storedPlan = usePlanStore.getState().plans.find((p) => p.id === 'plan-1');
      expect(storedPlan?.content).toBe('# Updated Content');
    });

    it('should set error state on failure', async () => {
      vi.mocked(planApi.updatePlanContent).mockRejectedValueOnce(
        new Error('Update content failed')
      );

      usePlanStore.getState().addPlan(mockPlan);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        try {
          await result.current.updatePlanContent('plan-1', '# Updated Content');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Update content failed');
    });
  });

  describe('deletePlan', () => {
    it('should delete plan in API and store', async () => {
      vi.mocked(planApi.deletePlan).mockResolvedValueOnce(true);

      usePlanStore.getState().addPlan(mockPlan);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        await result.current.deletePlan('plan-1');
      });

      expect(planApi.deletePlan).toHaveBeenCalledWith('plan-1');
      expect(usePlanStore.getState().plans).toHaveLength(0);
    });

    it('should set error state on failure', async () => {
      vi.mocked(planApi.deletePlan).mockRejectedValueOnce(
        new Error('Delete failed')
      );

      usePlanStore.getState().addPlan(mockPlan);

      const { result } = renderHook(() =>
        usePlanPersistence({ sessionId: 'session-1', autoLoad: false })
      );

      await act(async () => {
        try {
          await result.current.deletePlan('plan-1');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Delete failed');
      // Plan should still be in store since delete failed
      expect(usePlanStore.getState().plans).toHaveLength(1);
    });
  });

  describe('session change handling', () => {
    it('should reload plans when session ID changes', async () => {
      vi.mocked(planApi.fetchPlansForSession)
        .mockResolvedValueOnce([mockPlan])
        .mockResolvedValueOnce([]);

      const { rerender } = renderHook(
        ({ sessionId }) => usePlanPersistence({ sessionId }),
        { initialProps: { sessionId: 'session-1' } }
      );

      await waitFor(() => {
        expect(planApi.fetchPlansForSession).toHaveBeenCalledWith('session-1');
      });

      rerender({ sessionId: 'session-2' });

      await waitFor(() => {
        expect(planApi.fetchPlansForSession).toHaveBeenCalledWith('session-2');
      });
    });
  });
});
