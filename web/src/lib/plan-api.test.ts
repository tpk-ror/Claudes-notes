import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as planApi from './plan-api';
import type { Plan } from '../store/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Plan API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPlan: Plan = {
    id: 'plan-1',
    sessionId: 'session-1',
    title: 'Test Plan',
    content: '# Plan Content',
    status: 'draft',
    tasks: [],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    approvedAt: undefined,
  };

  describe('fetchPlansForSession', () => {
    it('should fetch plans for a session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          plans: [
            {
              ...mockPlan,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        }),
      });

      const plans = await planApi.fetchPlansForSession('session-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/plans?sessionId=session-1'
      );
      expect(plans).toHaveLength(1);
      expect(plans[0].id).toBe('plan-1');
      expect(plans[0].createdAt).toBeInstanceOf(Date);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(
        planApi.fetchPlansForSession('session-1')
      ).rejects.toThrow('Server error');
    });

    it('should URL encode session ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plans: [] }),
      });

      await planApi.fetchPlansForSession('session with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/plans?sessionId=session%20with%20spaces'
      );
    });
  });

  describe('fetchPlanById', () => {
    it('should fetch a plan by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          plan: {
            ...mockPlan,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        }),
      });

      const plan = await planApi.fetchPlanById('plan-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/plans/plan-1');
      expect(plan.id).toBe('plan-1');
      expect(plan.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Plan not found' }),
      });

      await expect(planApi.fetchPlanById('plan-1')).rejects.toThrow(
        'Plan not found'
      );
    });
  });

  describe('createPlan', () => {
    it('should create a plan', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          plan: {
            ...mockPlan,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        }),
      });

      const plan = await planApi.createPlan({
        id: 'plan-1',
        sessionId: 'session-1',
        title: 'Test Plan',
        content: '# Plan Content',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Test Plan',
          content: '# Plan Content',
        }),
      });
      expect(plan.id).toBe('plan-1');
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create plan' }),
      });

      await expect(
        planApi.createPlan({
          id: 'plan-1',
          sessionId: 'session-1',
          title: 'Test Plan',
          content: '# Plan Content',
        })
      ).rejects.toThrow('Failed to create plan');
    });
  });

  describe('approvePlan', () => {
    it('should approve a plan', async () => {
      const approvedPlan = {
        ...mockPlan,
        status: 'approved',
        approvedAt: '2024-01-02T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plan: approvedPlan }),
      });

      const plan = await planApi.approvePlan('plan-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve: true }),
      });
      expect(plan.status).toBe('approved');
      expect(plan.approvedAt).toBeInstanceOf(Date);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to approve plan' }),
      });

      await expect(planApi.approvePlan('plan-1')).rejects.toThrow(
        'Failed to approve plan'
      );
    });
  });

  describe('updatePlanStatus', () => {
    it('should update plan status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          plan: {
            ...mockPlan,
            status: 'executed',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        }),
      });

      const plan = await planApi.updatePlanStatus('plan-1', 'executed');

      expect(mockFetch).toHaveBeenCalledWith('/api/plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'executed' }),
      });
      expect(plan.status).toBe('executed');
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update plan status' }),
      });

      await expect(
        planApi.updatePlanStatus('plan-1', 'executed')
      ).rejects.toThrow('Failed to update plan status');
    });
  });

  describe('updatePlanContent', () => {
    it('should update plan content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          plan: {
            ...mockPlan,
            content: '# Updated Content',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        }),
      });

      const plan = await planApi.updatePlanContent('plan-1', '# Updated Content');

      expect(mockFetch).toHaveBeenCalledWith('/api/plans/plan-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: '# Updated Content' }),
      });
      expect(plan.content).toBe('# Updated Content');
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update plan content' }),
      });

      await expect(
        planApi.updatePlanContent('plan-1', '# New Content')
      ).rejects.toThrow('Failed to update plan content');
    });
  });

  describe('deletePlan', () => {
    it('should delete a plan', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const success = await planApi.deletePlan('plan-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/plans/plan-1', {
        method: 'DELETE',
      });
      expect(success).toBe(true);
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete plan' }),
      });

      await expect(planApi.deletePlan('plan-1')).rejects.toThrow(
        'Failed to delete plan'
      );
    });
  });

  describe('date parsing', () => {
    it('should parse createdAt date string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          plan: {
            ...mockPlan,
            createdAt: '2024-06-15T12:30:00.000Z',
          },
        }),
      });

      const plan = await planApi.fetchPlanById('plan-1');

      expect(plan.createdAt).toBeInstanceOf(Date);
      expect(plan.createdAt.toISOString()).toBe('2024-06-15T12:30:00.000Z');
    });

    it('should parse approvedAt date string when present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          plan: {
            ...mockPlan,
            status: 'approved',
            approvedAt: '2024-06-16T08:00:00.000Z',
            createdAt: '2024-06-15T12:30:00.000Z',
          },
        }),
      });

      const plan = await planApi.fetchPlanById('plan-1');

      expect(plan.approvedAt).toBeInstanceOf(Date);
      expect(plan.approvedAt?.toISOString()).toBe('2024-06-16T08:00:00.000Z');
    });

    it('should leave approvedAt undefined when null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          plan: {
            ...mockPlan,
            approvedAt: null,
            createdAt: '2024-06-15T12:30:00.000Z',
          },
        }),
      });

      const plan = await planApi.fetchPlanById('plan-1');

      expect(plan.approvedAt).toBeUndefined();
    });
  });
});
