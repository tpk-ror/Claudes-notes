# Architecture

System architecture and design decisions for the Claude's Notes monorepo.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User                                  │
└─────────────────────────────────────────────────────────────┘
                │                              │
                ▼                              ▼
┌───────────────────────────┐    ┌────────────────────────────┐
│      Claude's Notes       │    │       Ralphy CLI           │
│      (Web App)            │    │                            │
│                           │    │  ┌──────────────────────┐  │
│  ┌─────────────────────┐  │    │  │    Task Sources      │  │
│  │   React Frontend    │  │    │  │  (MD/YAML/GitHub)    │  │
│  │   (Zustand stores)  │  │    │  └──────────────────────┘  │
│  └─────────────────────┘  │    │             │              │
│           │               │    │             ▼              │
│           ▼               │    │  ┌──────────────────────┐  │
│  ┌─────────────────────┐  │    │  │   Execution Engine   │  │
│  │   Next.js API       │  │    │  │ (Sequential/Parallel)│  │
│  │   (/api/claude)     │  │    │  └──────────────────────┘  │
│  └─────────────────────┘  │    │             │              │
│           │               │    │             ▼              │
│           ▼               │    │  ┌──────────────────────┐  │
│  ┌─────────────────────┐  │    │  │    AI Engines        │  │
│  │   SQLite + Drizzle  │  │    │  │ (Claude/Codex/etc.)  │  │
│  └─────────────────────┘  │    │  └──────────────────────┘  │
└───────────────────────────┘    └────────────────────────────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
                ┌────────────────────────────┐
                │      Claude CLI            │
                │   (subprocess)             │
                └────────────────────────────┘
                               │
                               ▼
                ┌────────────────────────────┐
                │      Claude API            │
                │   (Anthropic)              │
                └────────────────────────────┘
```

## Web Application Architecture

### Data Flow

```
User Input → React Component → Zustand Store → API Route → Claude CLI → SSE → Store → UI Update
```

1. User types message in chat input
2. Message store updates with user message
3. POST request to `/api/claude/stream`
4. API spawns Claude CLI subprocess
5. CLI stdout streams JSON events
6. Events sent as SSE to browser
7. Message store parses and updates state
8. React components re-render

### Component Architecture

```
App
├── Header
│   ├── SessionSelector
│   └── ThemeToggle
├── Sidebar
│   ├── SessionList
│   └── NewSessionButton
├── ChatPanel
│   ├── MessageList
│   │   ├── UserMessage
│   │   └── AssistantMessage
│   │       ├── TextContent
│   │       ├── ThinkingBlock (collapsible)
│   │       └── ToolCall
│   └── ChatInput
└── PlanPanel (conditional)
    ├── PlanHeader
    ├── TaskList
    └── ApprovalButtons
```

### State Management

Zustand stores are split by domain:

```typescript
// session-store.ts
interface SessionStore {
  sessions: Session[];
  activeSessionId: string | null;
  createSession: (projectPath: string) => Promise<Session>;
  setActiveSession: (id: string) => void;
  // ...
}

// message-store.ts
interface MessageStore {
  messages: Map<string, Message[]>;
  isStreaming: boolean;
  sendMessage: (sessionId: string, content: string) => Promise<void>;
  // ...
}

// plan-store.ts
interface PlanStore {
  plans: Map<string, Plan>;
  approvePlan: (planId: string) => Promise<void>;
  rejectPlan: (planId: string, reason: string) => Promise<void>;
  // ...
}
```

### Database Schema

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  sessions   │───1:N─│   plans     │───1:N─│   tasks     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ slug        │       │ session_id  │       │ plan_id     │
│ projectPath │       │ title       │       │ parent_id   │
│ model       │       │ content     │       │ content     │
│ createdAt   │       │ status      │       │ status      │
│ lastActiveAt│       │ createdAt   │       │ sortOrder   │
│ messageCount│       │ approvedAt  │       └─────────────┘
│ totalCostUsd│       └─────────────┘
│ cliSessionId│
└─────────────┘
        │
        │ 1:N
        ▼
┌─────────────┐
│  messages   │
├─────────────┤
│ id          │
│ session_id  │
│ role        │
│ content     │
│ toolCalls   │
│ thinkingBlocks│
│ timestamp   │
└─────────────┘
```

### API Design

REST-style routes:

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/claude/stream` | Stream chat message (SSE) |
| GET | `/api/sessions` | List sessions |
| POST | `/api/sessions` | Create session |
| GET | `/api/sessions/:id` | Get session |
| DELETE | `/api/sessions/:id` | Delete session |
| GET | `/api/plans` | List plans |
| POST | `/api/plans` | Create plan |
| GET | `/api/plans/:id` | Get plan |
| PATCH | `/api/plans/:id` | Update plan |
| DELETE | `/api/plans/:id` | Delete plan |
| GET | `/api/health` | Health check |

## CLI Architecture

### Command Structure

```
ralphy
├── [task]              # Brownfield single task
├── --init              # Initialize config
├── --config            # Show config
└── --add-rule <rule>   # Add rule to config

(implicit)
└── loop                # PRD loop mode (when no task given)
```

### Engine Abstraction

Strategy pattern for AI engines:

```typescript
// base.ts
interface AIEngine {
  name: string;
  cliCommand: string;
  buildArgs(task: string, context: EngineContext): string[];
  parseOutput(output: string): EngineResult;
  isAvailable(): Promise<boolean>;
}

// claude.ts
class ClaudeEngine implements AIEngine {
  name = "Claude Code";
  cliCommand = "claude";
  // ...
}

// index.ts
function createEngine(name: AIEngineName): AIEngine {
  switch (name) {
    case "claude": return new ClaudeEngine();
    case "opencode": return new OpenCodeEngine();
    // ...
  }
}
```

### Task Source Abstraction

```typescript
interface TaskSource {
  getNext(): Promise<Task | null>;
  markComplete(task: Task): Promise<void>;
  markFailed(task: Task, error: string): Promise<void>;
  countRemaining(): Promise<number>;
}

class MarkdownTaskSource implements TaskSource {
  // Parses - [ ] checkboxes from .md files
}

class YamlTaskSource implements TaskSource {
  // Parses structured tasks from .yaml files
}

class GitHubTaskSource implements TaskSource {
  // Fetches issues from GitHub API
}
```

### Execution Strategies

```
┌─────────────────────────────────────────┐
│           Execution Runner              │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│  Sequential   │       │   Parallel    │
│   Runner      │       │    Runner     │
├───────────────┤       ├───────────────┤
│ - Main branch │       │ - Worktrees   │
│ - One task    │       │ - Branches    │
│ - Simple      │       │ - Concurrent  │
└───────────────┘       └───────────────┘
```

#### Sequential Execution

```
Task 1 → AI → Verify → Commit → Task 2 → AI → Verify → Commit → ...
```

#### Parallel Execution

```
                    ┌─────────────────────┐
                    │    Main Repo        │
                    │    (main branch)    │
                    └─────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Worktree 1  │  │  Worktree 2  │  │  Worktree 3  │
    │  (feature-1) │  │  (feature-2) │  │  (feature-3) │
    │              │  │              │  │              │
    │  Task 1      │  │  Task 2      │  │  Task 3      │
    │     ↓        │  │     ↓        │  │     ↓        │
    │  AI Agent    │  │  AI Agent    │  │  AI Agent    │
    │     ↓        │  │     ↓        │  │     ↓        │
    │  Verify      │  │  Verify      │  │  Verify      │
    │     ↓        │  │     ↓        │  │     ↓        │
    │  Create PR   │  │  Create PR   │  │  Create PR   │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### Retry Logic

```
Task Execution
      │
      ▼
   Success? ──Yes──→ Mark Complete
      │
      No
      │
      ▼
Retries < Max? ──No──→ Mark Failed
      │
      Yes
      │
      ▼
Wait (exponential backoff)
      │
      └──→ Task Execution
```

Default: 3 retries with 5-second base delay.

## Design Decisions

### Why CLI Subprocess (Not Direct API)?

1. **Authentication** - CLI handles auth (OAuth, API keys)
2. **Features** - CLI has plan mode, tools, safety checks
3. **Updates** - CLI updates independently
4. **Security** - No API keys in web app code

### Why SQLite?

1. **Simplicity** - No external database server
2. **Portability** - Single file, easy backup
3. **Performance** - Fast for single-user local app
4. **Drizzle** - Type-safe ORM with good SQLite support

### Why Zustand?

1. **Simplicity** - Minimal boilerplate vs Redux
2. **Performance** - Fine-grained subscriptions
3. **TypeScript** - Excellent type inference
4. **Size** - Tiny bundle size

### Why Bun for CLI?

1. **Speed** - Fast startup and execution
2. **TypeScript** - Native TS support
3. **Bundling** - Built-in bundler for binaries
4. **Cross-platform** - Single binary per platform

### Why Git Worktrees for Parallel?

1. **Isolation** - Each task has clean working directory
2. **Branches** - Natural branch per task
3. **Efficiency** - Shares .git directory
4. **Cleanup** - Easy to remove after task

## Security Considerations

### Web App

- **Localhost only** - Server binds to 127.0.0.1
- **No API keys** - CLI manages authentication
- **Input validation** - Sanitize user input
- **Process isolation** - CLI runs as subprocess

### CLI

- **File boundaries** - Respects `never_touch` config
- **No secrets in logs** - Verbose mode filters sensitive data
- **Git safety** - Doesn't force-push or modify history

## Performance Considerations

### Web App

- **SSE streaming** - Immediate feedback, no polling
- **Optimistic updates** - UI updates before API confirms
- **Lazy loading** - Load messages on scroll
- **SQLite WAL** - Write-ahead logging for concurrency

### CLI

- **Parallel execution** - Configurable concurrency
- **Lazy task loading** - Don't parse all tasks upfront
- **Process reuse** - Keep CLI process warm when possible
- **Efficient git ops** - Batch git commands
