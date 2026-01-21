// Type definitions for Claude's Notes state management
// Based on PRD Section 6.4 Data Models

export interface Session {
  id: string;
  slug: string;
  projectPath: string;
  model: string;
  createdAt: Date;
  lastActiveAt: Date;
  messageCount: number;
  totalCostUsd: string;
  /** CLI session ID used with --resume flag to continue conversations */
  cliSessionId?: string;
}

export type PlanStatus = 'draft' | 'approved' | 'executed' | 'archived';

export interface Plan {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  status: PlanStatus;
  tasks: Task[];
  createdAt: Date;
  approvedAt?: Date;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  planId: string;
  parentId?: string;
  content: string;
  status: TaskStatus;
  sortOrder: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
}

export interface ThinkingBlock {
  id: string;
  content: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  thinkingBlocks?: ThinkingBlock[];
  timestamp: Date;
}
