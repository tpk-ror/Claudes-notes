# Ralphy CLI

Autonomous AI coding loop that orchestrates AI agents on tasks. Supports Claude Code, OpenCode, Codex, Cursor, Qwen-Code, and Factory Droid.

## Installation

```bash
npm install -g ralphy-cli
```

Or run directly with Bun:

```bash
cd cli
bun run dev
```

## Usage Modes

### Single Task (Brownfield)

Execute a single task directly:

```bash
ralphy "Add a logout button to the header"
```

### Task List Loop (PRD)

Process multiple tasks from a file:

```bash
# From Markdown (default: PRD.md)
ralphy

# From specific Markdown file
ralphy --prd tasks.md

# From YAML file
ralphy --yaml tasks.yaml

# From GitHub Issues
ralphy --github owner/repo --github-label "ai-task"
```

## Commands

| Command | Description |
|---------|-------------|
| `ralphy [task]` | Run single task or PRD loop |
| `ralphy --init` | Initialize `.ralphy/` configuration |
| `ralphy --config` | Show current configuration |
| `ralphy --add-rule <rule>` | Add a rule to config |

## Flags

### AI Engine Selection

| Flag | Engine |
|------|--------|
| `--claude` | Claude Code (default) |
| `--opencode` | OpenCode |
| `--cursor` | Cursor Agent |
| `--codex` | Codex |
| `--qwen` | Qwen-Code |
| `--droid` | Factory Droid |

### Execution Control

| Flag | Description |
|------|-------------|
| `--dry-run` | Show what would be done without executing |
| `--max-iterations <n>` | Maximum iterations (0 = unlimited) |
| `--max-retries <n>` | Maximum retries per task (default: 3) |
| `--retry-delay <n>` | Delay between retries in seconds (default: 5) |

### Verification

| Flag | Description |
|------|-------------|
| `--no-tests` / `--skip-tests` | Skip running tests |
| `--no-lint` / `--skip-lint` | Skip running lint |
| `--fast` | Skip both tests and lint |

### Parallel Execution

| Flag | Description |
|------|-------------|
| `--parallel` | Run tasks in parallel using git worktrees |
| `--max-parallel <n>` | Maximum parallel agents (default: 3) |

### Git Integration

| Flag | Description |
|------|-------------|
| `--branch-per-task` | Create a branch for each task |
| `--base-branch <branch>` | Base branch for PRs |
| `--create-pr` | Create pull request after each task |
| `--draft-pr` | Create PRs as draft |
| `--no-commit` | Don't auto-commit changes |

### Task Sources

| Flag | Description |
|------|-------------|
| `--prd <file>` | Markdown PRD file (default: PRD.md) |
| `--yaml <file>` | YAML task file |
| `--github <repo>` | GitHub repo for issues (owner/repo) |
| `--github-label <label>` | Filter GitHub issues by label |

### Other

| Flag | Description |
|------|-------------|
| `--browser` | Enable browser automation (agent-browser) |
| `--no-browser` | Disable browser automation |
| `-v, --verbose` | Verbose output |

## Supported AI Engines

### Claude Code (default)

```bash
ralphy "Fix the login bug" --claude
```

Requires: `claude` CLI installed and authenticated.

### OpenCode

```bash
ralphy "Add tests" --opencode
```

Requires: `opencode` CLI installed.

### Cursor Agent

```bash
ralphy "Refactor database layer" --cursor
```

Requires: `cursor` CLI installed.

### Codex

```bash
ralphy "Generate documentation" --codex
```

Requires: `codex` CLI installed.

### Qwen-Code

```bash
ralphy "Optimize queries" --qwen
```

Requires: `qwen-code` CLI installed.

### Factory Droid

```bash
ralphy "Build API endpoint" --droid
```

Requires: `droid` CLI installed.

## Task Sources

### Markdown

Create a `PRD.md` file with checkbox tasks:

```markdown
# Project Tasks

- [ ] Add user authentication
- [ ] Create dashboard page
- [ ] Implement data export
```

Tasks are marked complete by checking the box: `- [x]`

### YAML

Create a `tasks.yaml` file:

```yaml
tasks:
  - title: Add user authentication
    description: Implement login/logout with JWT
    priority: high

  - title: Create dashboard page
    description: Show user metrics and charts
    priority: medium
```

### GitHub Issues

Fetch tasks from GitHub Issues:

```bash
ralphy --github owner/repo --github-label "ai-task"
```

Requires: `GITHUB_TOKEN` environment variable.

## Execution Modes

### Sequential (default)

Tasks run one at a time in the main working directory:

```bash
ralphy
```

### Parallel

Tasks run concurrently using git worktrees:

```bash
ralphy --parallel --max-parallel 3
```

Each parallel task:
1. Creates a new git worktree
2. Creates a feature branch
3. Runs the AI agent
4. Optionally creates a PR
5. Cleans up the worktree

## Browser Automation

Enable browser automation for tasks that need web interaction:

```bash
ralphy "Test the checkout flow" --browser
```

Uses `agent-browser` for browser control. Mode options:
- `--browser` - Always enable
- `--no-browser` - Always disable
- (default) - Auto-detect based on task

## Examples

### Basic single task

```bash
ralphy "Add a dark mode toggle"
```

### PRD loop with verification

```bash
ralphy --prd features.md
```

### Parallel execution with PRs

```bash
ralphy --parallel --create-pr --draft-pr
```

### GitHub Issues workflow

```bash
export GITHUB_TOKEN=ghp_xxx
ralphy --github myorg/myrepo --github-label "ready" --create-pr
```

### Fast iteration (skip tests/lint)

```bash
ralphy "Quick prototype" --fast
```
