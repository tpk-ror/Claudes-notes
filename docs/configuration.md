# Configuration

Configuration options for both the web app and CLI.

## CLI Configuration

### Config File

Initialize configuration:

```bash
ralphy --init
```

This creates `.ralphy/config.yaml`:

```yaml
project:
  name: "my-project"
  language: "typescript"
  framework: "next"
  description: "A Next.js application"

commands:
  test: "npm test"
  lint: "npm run lint"
  build: "npm run build"

rules:
  - "Use TypeScript strict mode"
  - "Write tests for new features"
  - "Follow existing code patterns"

boundaries:
  never_touch:
    - "node_modules/"
    - ".env"
    - "*.lock"
```

### Config Sections

#### project

Project metadata used for context:

| Field | Description |
|-------|-------------|
| name | Project name |
| language | Primary language (typescript, python, etc.) |
| framework | Framework in use (next, react, express, etc.) |
| description | Brief project description |

#### commands

Shell commands for verification:

| Field | Description |
|-------|-------------|
| test | Test command (e.g., `npm test`, `pytest`) |
| lint | Lint command (e.g., `npm run lint`, `eslint .`) |
| build | Build command (e.g., `npm run build`) |

These run after each task unless skipped with `--fast` or `--skip-tests`/`--skip-lint`.

#### rules

AI behavior guidelines:

```yaml
rules:
  - "Use TypeScript strict mode"
  - "Prefer functional components"
  - "Add JSDoc comments to public functions"
```

Add rules via CLI:

```bash
ralphy --add-rule "Always use async/await"
```

#### boundaries

Files and directories the AI should not modify:

```yaml
boundaries:
  never_touch:
    - "migrations/"
    - "vendor/"
    - ".env*"
```

### Show Configuration

View current config:

```bash
ralphy --config
```

## CLI Flags Reference

### Engine Flags

| Flag | Engine | Default |
|------|--------|---------|
| `--claude` | Claude Code | Yes |
| `--opencode` | OpenCode | No |
| `--cursor` | Cursor Agent | No |
| `--codex` | Codex | No |
| `--qwen` | Qwen-Code | No |
| `--droid` | Factory Droid | No |

### Execution Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--dry-run` | Preview without executing | false |
| `--max-iterations <n>` | Max iterations (0=unlimited) | 0 |
| `--max-retries <n>` | Retries per failed task | 3 |
| `--retry-delay <n>` | Seconds between retries | 5 |
| `--parallel` | Parallel execution | false |
| `--max-parallel <n>` | Max concurrent agents | 3 |

### Verification Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--no-tests` | Skip test command | false |
| `--no-lint` | Skip lint command | false |
| `--fast` | Skip both tests and lint | false |

### Git Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--branch-per-task` | Create branch for each task | false |
| `--base-branch <branch>` | Base branch for PRs | auto-detect |
| `--create-pr` | Create PR after task | false |
| `--draft-pr` | Create PRs as draft | false |
| `--no-commit` | Disable auto-commit | false |

### Task Source Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--prd <file>` | Markdown task file | PRD.md |
| `--yaml <file>` | YAML task file | - |
| `--github <repo>` | GitHub repo (owner/repo) | - |
| `--github-label <label>` | Filter issues by label | - |

### Browser Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--browser` | Enable browser automation | auto |
| `--no-browser` | Disable browser automation | - |

### Other Flags

| Flag | Description |
|------|-------------|
| `-v, --verbose` | Verbose output |
| `--version` | Show version |
| `--help` | Show help |

## Environment Variables

### GITHUB_TOKEN

Required for GitHub Issues task source:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
ralphy --github owner/repo
```

### PATH

AI engine CLIs must be in your PATH:

- `claude` - Claude Code CLI
- `opencode` - OpenCode CLI
- `cursor` - Cursor CLI
- `codex` - Codex CLI
- `qwen-code` - Qwen CLI
- `droid` - Factory Droid CLI

## Web App Configuration

The web app has minimal configuration. Key settings:

### Server Binding

The development and production servers bind to `127.0.0.1` (localhost only) for security:

```bash
npm run dev   # Runs on 127.0.0.1:3000
npm run start # Runs on 127.0.0.1:3000
```

### Database

SQLite database is stored at `web/sqlite.db`. Initialize with:

```bash
npm run db:migrate
```

### Project Path

When starting a chat, specify the project path to set the CLI working directory. This determines where Claude reads/writes files.
