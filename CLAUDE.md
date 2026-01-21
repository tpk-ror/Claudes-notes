# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing two interconnected projects:
- **Claude's Notes** (`/web`) - Next.js web UI for Claude Code CLI with planning capabilities
- **Ralphy CLI** (`/cli`) - Autonomous AI coding loop that orchestrates AI agents on tasks

## Commands

### Web Application (`/web`)

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run test         # Run tests once (Vitest)
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint
npm run db:migrate   # Initialize SQLite database
npm run db:studio    # Open Drizzle Studio GUI
```

### CLI (`/cli`)

```bash
npm run dev          # Run TypeScript directly with Bun
npm run check        # Biome linter/formatter
npm run build:all    # Build cross-platform binaries
```

## Architecture

### Web App: Claude CLI Integration

The web app does NOT call the Claude API directly. It spawns the locally installed `claude` CLI as a subprocess and streams output via SSE.

**Flow:** Browser → Next.js API (`/api/claude/stream`) → Claude CLI subprocess → SSE → Browser

Key file: `web/src/app/api/claude/stream/route.ts`

The CLI is invoked with:
- `--print --output-format stream-json --verbose --permission-mode plan`
- On Windows: `shell: true` (required for .cmd files), message wrapped in quotes
- Session resume: `--resume <sessionId>`

### Web App: State Management

Zustand stores in `web/src/store/`:
- `session-store.ts` - Session lifecycle, CLI session IDs
- `message-store.ts` - Chat message history
- `plan-store.ts` - Plan status, tasks, approval workflow
- `theme-store.ts` - Dark/light mode preference

### Web App: Database

SQLite with Drizzle ORM. Schema in `web/src/db/schema.ts`:
- `sessions` - Chat sessions with project path, model, costs
- `plans` - Plans with status (draft/approved/executed/archived)
- `tasks` - Hierarchical tasks belonging to plans
- `messages` - Chat messages with tool calls and thinking blocks

### CLI: Engine Abstraction

Strategy pattern for AI engines in `cli/src/engines/`:
- Base interface in `base.ts`
- Implementations: Claude Code, OpenCode, Cursor, Qwen, Codex, Factory Droid
- Each engine knows how to invoke its CLI and parse output

### CLI: Task Sources

Task parsers in `cli/src/tasks/`:
- Markdown: Parse `- [ ]` task lists from `.md` files
- YAML: Structured tasks from `.yaml` files
- GitHub Issues: Fetch tasks from GitHub API

### CLI: Execution Modes

Execution strategies in `cli/src/execution/`:
- Sequential: One task at a time
- Parallel: Multiple git worktrees + branches, concurrent execution
- Retry logic with exponential backoff

## Key Patterns

### SSE Event Format

Claude CLI outputs JSON events that the web app parses:
```json
{"type": "system", "subtype": "init", "session_id": "uuid"}
{"type": "content_block_delta", "delta": {"type": "text_delta", "text": "..."}}
{"type": "content_block_delta", "delta": {"type": "thinking_delta", "thinking": "..."}}
{"type": "tool_use", "tool_name": "...", "args": {...}}
{"type": "result", "session_id": "uuid", "is_error": false}
```

### Windows Compatibility

The web app handles Windows shell differences:
- Uses `shell: true` when spawning CLI (required for .cmd files)
- Escapes double quotes and wraps message in quotes to prevent word splitting

### Security Constraints

- Server binds to `127.0.0.1` only (localhost access)
- No API keys in web app - CLI manages authentication
- All AI requests go through local CLI subprocess

## Tech Stack

**Web:** Next.js 14 (App Router), shadcn/ui, Tailwind CSS v4, Zustand v5, SQLite + Drizzle, Vitest

**CLI:** TypeScript/Bun, Commander.js, simple-git, Octokit, Zod, Biome

## Documentation

User-facing documentation lives in `/docs/`. When making changes to the application:

1. **New features** - Document in the appropriate file (`web-app.md` or `cli.md`)
2. **API changes** - Update API routes section in `web-app.md`
3. **CLI flag changes** - Update commands section in `cli.md` and `configuration.md`
4. **Config changes** - Update `configuration.md`
5. **Database schema changes** - Update database section in `web-app.md`
6. **Architecture changes** - Update `Architecture.md`

Keep documentation concise and focused on user-facing behavior. Internal implementation details belong in code comments, not docs.
