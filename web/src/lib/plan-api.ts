// Client-side API functions for plan operations
// These functions call the API routes and handle responses

import type { Plan, Task, PlanStatus } from '../store/types';

const API_BASE = '/api/plans';

export interface ApiError {
  error: string;
  status: number;
}

export interface GetPlansResponse {
  plans: Plan[];
}

export interface GetPlanResponse {
  plan: Plan;
}

export interface CreatePlanResponse {
  plan: Plan;
}

export interface UpdatePlanResponse {
  plan: Plan;
}

export interface DeletePlanResponse {
  success: boolean;
}

/**
 * Fetch all plans for a session
 */
export async function fetchPlansForSession(
  sessionId: string
): Promise<Plan[]> {
  const response = await fetch(`${API_BASE}?sessionId=${encodeURIComponent(sessionId)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch plans');
  }

  const data: GetPlansResponse = await response.json();

  // Convert date strings back to Date objects
  return data.plans.map(parsePlanDates);
}

/**
 * Fetch a single plan by ID
 */
export async function fetchPlanById(planId: string): Promise<Plan> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(planId)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch plan');
  }

  const data: GetPlanResponse = await response.json();
  return parsePlanDates(data.plan);
}

/**
 * Create a new plan
 */
export async function createPlan(plan: {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  status?: PlanStatus;
  tasks?: Task[];
}): Promise<Plan> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(plan),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create plan');
  }

  const data: CreatePlanResponse = await response.json();
  return parsePlanDates(data.plan);
}

/**
 * Approve a plan
 */
export async function approvePlan(planId: string): Promise<Plan> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(planId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ approve: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve plan');
  }

  const data: UpdatePlanResponse = await response.json();
  return parsePlanDates(data.plan);
}

/**
 * Update plan status
 */
export async function updatePlanStatus(
  planId: string,
  status: PlanStatus
): Promise<Plan> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(planId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update plan status');
  }

  const data: UpdatePlanResponse = await response.json();
  return parsePlanDates(data.plan);
}

/**
 * Update plan content
 */
export async function updatePlanContent(
  planId: string,
  content: string
): Promise<Plan> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(planId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update plan content');
  }

  const data: UpdatePlanResponse = await response.json();
  return parsePlanDates(data.plan);
}

/**
 * Delete a plan
 */
export async function deletePlan(planId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(planId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete plan');
  }

  const data: DeletePlanResponse = await response.json();
  return data.success;
}

/**
 * Parse date strings in a plan back to Date objects
 */
function parsePlanDates(plan: Plan): Plan {
  return {
    ...plan,
    createdAt: new Date(plan.createdAt),
    approvedAt: plan.approvedAt ? new Date(plan.approvedAt) : undefined,
  };
}
