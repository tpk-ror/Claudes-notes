# Development Guide

Setup and development workflows for the Claude's Notes monorepo.

## Prerequisites

### Required

- **Node.js** >= 18
- **Bun** >= 1.0 (for CLI development)
- **Claude CLI** - Install from [claude.ai/code](https://claude.ai/code)

### Optional

- **GitHub CLI** (`gh`) - For PR workflows
- **Additional AI CLIs** - OpenCode, Cursor, Codex, Qwen-Code, Factory Droid

## Initial Setup

Clone and install dependencies:

```bash
git clone <repo-url>
cd claudes-notes

# Install web dependencies
cd web
npm install

# Install CLI dependencies
cd ../cli
bun install
```

## Web Application

### Setup Database

Initialize the SQLite database:

```bash
cd web
npm run db:migrate
```

### Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Run Tests

```bash
# Single run
npm run test

# Watch mode
npm run test:watch
```

### Lint

```bash
npm run lint
```

### Build for Production

```bash
npm run build
npm run start
```

### Database Tools

```bash
# Generate migrations after schema changes
npm run db:generate

# Open Drizzle Studio GUI
npm run db:studio
```

## CLI

### Run Locally

```bash
cd cli

# Run with Bun directly
bun run dev

# Or run with arguments
bun run src/index.ts "Add a feature"
```

### Lint and Format

```bash
npm run check
```

Uses Biome for linting and formatting.

### Build Binaries

Build for all platforms:

```bash
npm run build:all
```

Build for specific platforms:

```bash
npm run build:darwin-arm64   # macOS Apple Silicon
npm run build:darwin-x64     # macOS Intel
npm run build:linux-x64      # Linux x64
npm run build:linux-arm64    # Linux ARM
npm run build:windows-x64    # Windows
```

Binaries are output to `cli/dist/`.

### Test CLI Locally

```bash
# Link for global usage
cd cli
npm link

# Now available as 'ralphy'
ralphy --help
```

## Project Structure

```
/
├── web/                      # Next.js web application
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   │   ├── api/         # API routes
│   │   │   └── page.tsx     # Main page
│   │   ├── components/      # React components
│   │   ├── db/              # Drizzle ORM schema/migrations
│   │   ├── lib/             # Utilities
│   │   └── store/           # Zustand stores
│   ├── drizzle.config.ts    # Drizzle configuration
│   └── package.json
│
├── cli/                      # Ralphy CLI
│   ├── src/
│   │   ├── cli/             # Command definitions
│   │   │   └── commands/    # Subcommands
│   │   ├── config/          # Config loading/types
│   │   ├── engines/         # AI engine adapters
│   │   ├── execution/       # Sequential/parallel runners
│   │   ├── git/             # Git operations
│   │   ├── tasks/           # Task source parsers
│   │   └── ui/              # Terminal UI (spinner, logger)
│   └── package.json
│
├── docs/                     # Documentation
└── CLAUDE.md                # AI assistant instructions
```

## Testing Patterns

### Web App (Vitest)

Tests are co-located with source files (`*.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Mocking

The web app uses dependency injection for testability. Example from the Claude stream route:

```typescript
// Production: uses real spawn
import { spawn } from 'child_process';

// Test: inject mock spawn
import { setSpawnFunction } from './route';
setSpawnFunction(mockSpawn);
```

## Code Style

### Web App

- ESLint with Next.js config
- TypeScript strict mode
- Tailwind CSS for styling
- shadcn/ui components

### CLI

- Biome for linting and formatting
- TypeScript with Bun
- Zod for runtime validation

## Common Tasks

### Add a New API Route

1. Create `web/src/app/api/<route>/route.ts`
2. Export HTTP method handlers (`GET`, `POST`, etc.)
3. Add types if needed
4. Write tests in `route.test.ts`

### Add a New AI Engine

1. Create `cli/src/engines/<engine>.ts`
2. Implement the `AIEngine` interface from `base.ts`
3. Register in `cli/src/engines/index.ts`
4. Add CLI flag in `cli/src/cli/args.ts`

### Add a New Task Source

1. Create `cli/src/tasks/<source>.ts`
2. Implement the `TaskSource` interface
3. Register in `cli/src/tasks/index.ts`

### Modify Database Schema

1. Edit `web/src/db/schema.ts`
2. Run `npm run db:generate`
3. Run `npm run db:migrate`
4. Update type exports if needed

## Troubleshooting

### "Claude CLI not found"

Ensure `claude` is in your PATH:

```bash
claude --version
```

If not installed, visit [claude.ai/code](https://claude.ai/code).

### Database Errors

Reset the database:

```bash
rm web/sqlite.db
npm run db:migrate
```

### Port Already in Use

Kill the process on port 3000:

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### Windows Shell Issues

The web app uses `shell: true` when spawning the CLI on Windows. If you encounter issues, ensure:
- Claude CLI is installed as a `.cmd` file
- Your terminal supports the command
