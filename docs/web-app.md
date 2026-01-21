# Claude's Notes Web App

A Next.js web UI for interacting with Claude Code CLI, featuring chat sessions, plan management, and task tracking.

## Features

### Chat Interface
- Real-time streaming responses (token-by-token, <50ms latency)
- Markdown rendering with syntax highlighting (Shiki)
- Collapsible thinking blocks showing Claude's reasoning
- Tool call cards displaying name, arguments, and results
- Multi-line input (Shift+Enter for new line, Enter to submit)
- Auto-scroll to newest message

### Plan Visualization
- Tasks extracted from markdown into hierarchical tree structure
- Task status indicators: ○ pending, ◐ in-progress, ● completed
- Progress bar showing percentage of tasks completed
- Syntax-highlighted code blocks

### Plan Approval Workflow
- Plans start in "draft" status for review
- **Approve** button - Sets status to "approved", allows execution
- **Reject** button - Prompts for feedback, sends revision request to Claude
- **Edit** button - Opens plan in editable markdown view
- Status persisted to database (survives browser refresh)

### Session Management
- UUID generated for each new conversation
- Sessions persisted to SQLite database
- Session history sidebar grouped by date
- Resume sessions using CLI `--resume` flag (preserves context)
- Session metadata: model, cost, message count

### Theme
- Dark/light mode toggle
- Detects system preference
- Persists preference across sessions

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [☰]  Claude's Notes   [Session: auth-feature]    [⚙] [◐]  │
├───────────┬─────────────────────────────────────────────────┤
│           │                                                 │
│ Sessions  │  ┌─────────────────┬─────────────────────────┐ │
│           │  │                 │                         │ │
│ • Today   │  │    Chat Panel   │      Plan Panel         │ │
│   - auth  │  │                 │                         │ │
│   - api   │  │  [User message] │  ## Implementation     │ │
│           │  │                 │                         │ │
│ • Yester  │  │  [Assistant...] │  ### Tasks             │ │
│   - db    │  │  [streaming...] │  ○ Create auth module  │ │
│           │  │                 │  ○ Add middleware      │ │
│ ──────────│  │                 │  ○ Write tests         │ │
│           │  │                 │                         │ │
│ [+] New   │  │ ┌─────────────┐ │  ┌───────────────────┐ │ │
│           │  │ │ Type here...│ │  │ [Edit][✗][✓ Appr] │ │ │
│           │  │ └─────────────┘ │  └───────────────────┘ │ │
└───────────┴──┴─────────────────┴─────────────────────────┴─┘
```

- **Sidebar** - Collapsible session history grouped by date
- **Chat Panel** - Streaming messages, input field
- **Plan Panel** - Plan content with task tree and approval buttons
- **Responsive** - Minimum 1024px width

## Architecture

### CLI Integration

The web app does NOT call the Claude API directly. Instead, it spawns the locally installed `claude` CLI as a subprocess and streams output via SSE.

```
Browser → Next.js API (/api/claude/stream) → Claude CLI subprocess → SSE → Browser
```

The CLI is invoked with these flags:
- `--print` - Output mode
- `--output-format stream-json` - JSON streaming format
- `--verbose` - Include thinking blocks
- `--permission-mode plan` - Enable plan mode
- `--resume <sessionId>` - Resume existing session

### Windows Compatibility

On Windows, the CLI spawn uses `shell: true` because `claude` is typically a `.cmd` file. Messages are wrapped in quotes with escaped double-quotes to prevent shell word splitting.

## State Management

Zustand stores in `web/src/store/`:

| Store | Purpose |
|-------|---------|
| `session-store.ts` | Session lifecycle, active session, CLI session IDs |
| `message-store.ts` | Chat message history, streaming state |
| `plan-store.ts` | Plan status, tasks, approval/rejection workflow |
| `theme-store.ts` | Dark/light mode preference |

## Database

SQLite database with Drizzle ORM. Schema in `web/src/db/schema.ts`:

### Sessions Table

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (UUID) |
| slug | text | Human-readable identifier |
| projectPath | text | Working directory path |
| model | text | Model name used |
| createdAt | timestamp | Creation time |
| lastActiveAt | timestamp | Last activity time |
| messageCount | integer | Total messages in session |
| totalCostUsd | text | Accumulated cost |
| cliSessionId | text | CLI session ID for --resume |

### Plans Table

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| sessionId | text | Foreign key to sessions |
| title | text | Plan title |
| content | text | Plan content (markdown) |
| status | enum | draft, approved, executed, archived |
| createdAt | timestamp | Creation time |
| approvedAt | timestamp | Approval time |

### Tasks Table

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| planId | text | Foreign key to plans |
| parentId | text | Parent task ID (hierarchical) |
| content | text | Task description |
| status | enum | pending, in_progress, completed |
| sortOrder | integer | Display order |

### Messages Table

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| sessionId | text | Foreign key to sessions |
| role | enum | user, assistant, system |
| content | text | Message text |
| toolCalls | json | Tool invocations |
| thinkingBlocks | json | Reasoning blocks |
| timestamp | timestamp | Message time |

## API Routes

### POST /api/claude/stream

Stream a chat message to Claude CLI.

**Request:**
```json
{
  "message": "string",
  "sessionId": "string (optional)",
  "projectPath": "string (optional)"
}
```

**Response:** Server-Sent Events stream

Event types:
```json
{"type": "system", "subtype": "init", "session_id": "uuid"}
{"type": "content_block_delta", "delta": {"type": "text_delta", "text": "..."}}
{"type": "content_block_delta", "delta": {"type": "thinking_delta", "thinking": "..."}}
{"type": "tool_use", "tool_name": "...", "args": {...}}
{"type": "result", "session_id": "uuid", "is_error": false}
{"type": "stream_complete", "exitCode": 0}
```

### GET /api/sessions

List all sessions.

### POST /api/sessions

Create a new session.

### GET /api/sessions/[id]

Get session by ID.

### DELETE /api/sessions/[id]

Delete session and related data.

### GET /api/plans

List all plans.

### POST /api/plans

Create a new plan.

### GET /api/plans/[id]

Get plan by ID.

### PATCH /api/plans/[id]

Update plan (status, content).

### DELETE /api/plans/[id]

Delete plan.

### GET /api/health

Health check endpoint.

## Stream Event Types

Events received from the Claude CLI via SSE:

| Event Type | Description |
|------------|-------------|
| `system.init` | Session initialized, contains session_id |
| `content_block_delta` | Streaming text or thinking token |
| `tool_use` | Tool invocation started |
| `tool_result` | Tool execution completed |
| `message_stop` | Message complete |
| `result` | Session ended (success or error) |
| `stream_complete` | CLI process finished |
| `error` | Error from CLI stderr |
| `spawn_error` | CLI failed to start (e.g., not found) |

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial page load | < 2 seconds |
| Streaming token latency | < 50ms from CLI to UI |
| Message list scroll | Smooth with 1000+ messages |
| Session list load | < 500ms for 100 sessions |

## Security

- Server binds to `127.0.0.1` only (localhost access)
- No API keys stored in web app - CLI manages authentication
- All AI requests go through local CLI subprocess

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint
npm run db:migrate   # Initialize/migrate database
npm run db:generate  # Generate Drizzle migrations
npm run db:studio    # Open Drizzle Studio GUI
```
