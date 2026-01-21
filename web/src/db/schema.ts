// Database schema for Claude's Notes
// Based on PRD Section 6.4 Data Models

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Sessions table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  projectPath: text('project_path').notNull(),
  model: text('model').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }).notNull(),
  messageCount: integer('message_count').notNull().default(0),
  totalCostUsd: text('total_cost_usd').notNull().default('0.00'),
  /** CLI session ID used with --resume flag to continue conversations */
  cliSessionId: text('cli_session_id'),
});

// Plans table
export const plans = sqliteTable('plans', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  status: text('status', { enum: ['draft', 'approved', 'executed', 'archived'] })
    .notNull()
    .default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  planId: text('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  content: text('content').notNull(),
  status: text('status', { enum: ['pending', 'in_progress', 'completed'] })
    .notNull()
    .default('pending'),
  sortOrder: integer('sort_order').notNull().default(0),
});

// Messages table
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  toolCalls: text('tool_calls', { mode: 'json' }),
  thinkingBlocks: text('thinking_blocks', { mode: 'json' }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// Type exports for Drizzle inferred types
export type SessionRecord = typeof sessions.$inferSelect;
export type NewSessionRecord = typeof sessions.$inferInsert;
export type PlanRecord = typeof plans.$inferSelect;
export type NewPlanRecord = typeof plans.$inferInsert;
export type TaskRecord = typeof tasks.$inferSelect;
export type NewTaskRecord = typeof tasks.$inferInsert;
export type MessageRecord = typeof messages.$inferSelect;
export type NewMessageRecord = typeof messages.$inferInsert;
