# Claude's Notes Documentation

Documentation for the Claude's Notes monorepo.

## Projects

This monorepo contains two interconnected projects:

| Project | Path | Description |
|---------|------|-------------|
| [Claude's Notes](./web-app.md) | `/web` | Next.js web UI for Claude Code CLI with planning capabilities |
| [Ralphy CLI](./cli.md) | `/cli` | Autonomous AI coding loop that orchestrates AI agents on tasks |

## Quick Links

- [Web App Documentation](./web-app.md) - Chat interface, plans, sessions
- [CLI Documentation](./cli.md) - Task automation, AI engines, execution modes
- [Configuration](./configuration.md) - Config files, flags, environment variables
- [Development](./development.md) - Setup, testing, building
- [PRD](./PRD.md) - Product Requirements Document
- [Architecture](./Architecture.md) - System architecture and design decisions

## Implementation Status

See [/tasks.md](../tasks.md) for the complete implementation checklist. Current status: **V1.0 MVP Complete**

All core features implemented:
- Project setup (Next.js, Tailwind, shadcn/ui, Zustand, Drizzle)
- Database schema (sessions, plans, tasks, messages)
- CLI integration (spawn, SSE streaming, error handling)
- Chat UI (streaming, markdown, thinking blocks, tool calls)
- Plan visualization (task tree, status indicators, progress)
- Plan approval workflow (approve/reject/edit)
- Session management (create, resume, history)
- Dark/light theme with system detection

## Tech Stack

**Web Application:**
- Next.js 14 (App Router)
- shadcn/ui components
- Tailwind CSS v4
- Zustand v5 (state management)
- SQLite + Drizzle ORM
- Vitest (testing)

**CLI:**
- TypeScript / Bun
- Commander.js (CLI framework)
- simple-git (git operations)
- Octokit (GitHub API)
- Zod (validation)
- Biome (linting/formatting)

## Getting Started

### Web Application

```bash
cd web
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000

### CLI

```bash
cd cli
bun install
bun run dev
```

Or install globally:

```bash
npm install -g ralphy-cli
ralphy --help
```

## How It Works

The web app provides a browser-based chat interface that:
1. Spawns the locally installed Claude CLI as a subprocess
2. Streams output via Server-Sent Events (SSE)
3. Persists sessions, plans, and messages in SQLite
4. Supports plan approval workflows

The CLI automates AI-driven development by:
1. Reading tasks from Markdown, YAML, or GitHub Issues
2. Executing tasks sequentially or in parallel
3. Running verification (tests, lint) after each task
4. Optionally creating branches and pull requests

See [Architecture](./Architecture.md) for detailed system design.
