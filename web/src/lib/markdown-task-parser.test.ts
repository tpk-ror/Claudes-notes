import { describe, it, expect } from 'vitest';
import {
  extractTasksFromMarkdown,
  extractTaskContents,
  hasExtractableTasks,
  getTaskStats,
  type TaskExtractionResult,
  type TaskStats,
} from './markdown-task-parser';

describe('markdown-task-parser', () => {
  describe('extractTasksFromMarkdown', () => {
    describe('basic list parsing', () => {
      it('extracts tasks from unordered list with dashes', () => {
        const markdown = `- Task one
- Task two
- Task three`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(3);
        expect(result.tasks[0].content).toBe('Task one');
        expect(result.tasks[1].content).toBe('Task two');
        expect(result.tasks[2].content).toBe('Task three');
      });

      it('extracts tasks from unordered list with asterisks', () => {
        const markdown = `* First item
* Second item`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(2);
        expect(result.tasks[0].content).toBe('First item');
        expect(result.tasks[1].content).toBe('Second item');
      });

      it('extracts tasks from unordered list with plus signs', () => {
        const markdown = `+ Item A
+ Item B`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(2);
        expect(result.tasks[0].content).toBe('Item A');
        expect(result.tasks[1].content).toBe('Item B');
      });

      it('extracts tasks from ordered list with dots', () => {
        const markdown = `1. First step
2. Second step
3. Third step`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(3);
        expect(result.tasks[0].content).toBe('First step');
        expect(result.tasks[1].content).toBe('Second step');
        expect(result.tasks[2].content).toBe('Third step');
      });

      it('extracts tasks from ordered list with parentheses', () => {
        const markdown = `1) Do this
2) Then that`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(2);
        expect(result.tasks[0].content).toBe('Do this');
        expect(result.tasks[1].content).toBe('Then that');
      });

      it('handles mixed list markers', () => {
        const markdown = `- Dash item
* Asterisk item
+ Plus item
1. Numbered item`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(4);
        expect(result.tasks[0].content).toBe('Dash item');
        expect(result.tasks[1].content).toBe('Asterisk item');
        expect(result.tasks[2].content).toBe('Plus item');
        expect(result.tasks[3].content).toBe('Numbered item');
      });
    });

    describe('checkbox status parsing', () => {
      it('parses unchecked checkbox as pending', () => {
        const markdown = `- [ ] Unchecked task`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].content).toBe('Unchecked task');
        expect(result.tasks[0].status).toBe('pending');
      });

      it('parses checked checkbox (lowercase x) as completed', () => {
        const markdown = `- [x] Completed task`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].content).toBe('Completed task');
        expect(result.tasks[0].status).toBe('completed');
      });

      it('parses checked checkbox (uppercase X) as completed', () => {
        const markdown = `- [X] Also completed`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].content).toBe('Also completed');
        expect(result.tasks[0].status).toBe('completed');
      });

      it('parses in-progress checkbox (dash) as in_progress', () => {
        const markdown = `- [-] Working on it`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].content).toBe('Working on it');
        expect(result.tasks[0].status).toBe('in_progress');
      });

      it('parses in-progress checkbox (tilde) as in_progress', () => {
        const markdown = `- [~] Almost done`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].content).toBe('Almost done');
        expect(result.tasks[0].status).toBe('in_progress');
      });

      it('defaults to pending for non-checkbox list items', () => {
        const markdown = `- Regular item`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].content).toBe('Regular item');
        expect(result.tasks[0].status).toBe('pending');
      });

      it('handles mixed checkbox statuses', () => {
        const markdown = `- [ ] Pending
- [-] In progress
- [x] Completed`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(3);
        expect(result.tasks[0].status).toBe('pending');
        expect(result.tasks[1].status).toBe('in_progress');
        expect(result.tasks[2].status).toBe('completed');
      });

      it('works with ordered lists and checkboxes', () => {
        const markdown = `1. [ ] First pending
2. [x] Second done`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(2);
        expect(result.tasks[0].status).toBe('pending');
        expect(result.tasks[1].status).toBe('completed');
      });
    });

    describe('nested lists and hierarchy', () => {
      it('detects depth for nested items with spaces', () => {
        const markdown = `- Parent
  - Child
    - Grandchild`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.parsedTasks).toHaveLength(3);
        expect(result.parsedTasks[0].depth).toBe(0);
        expect(result.parsedTasks[1].depth).toBe(1);
        expect(result.parsedTasks[2].depth).toBe(2);
      });

      it('detects depth for nested items with tabs', () => {
        const markdown = `- Parent
\t- Child
\t\t- Grandchild`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.parsedTasks).toHaveLength(3);
        expect(result.parsedTasks[0].depth).toBe(0);
        expect(result.parsedTasks[1].depth).toBe(1);
        expect(result.parsedTasks[2].depth).toBe(2);
      });

      it('assigns parentId correctly for nested tasks', () => {
        const markdown = `- Parent
  - Child 1
  - Child 2
    - Grandchild`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(4);
        // Parent has no parentId
        expect(result.tasks[0].parentId).toBeUndefined();
        // Children point to parent
        expect(result.tasks[1].parentId).toBe('plan-1-task-0');
        expect(result.tasks[2].parentId).toBe('plan-1-task-0');
        // Grandchild points to Child 2
        expect(result.tasks[3].parentId).toBe('plan-1-task-2');
      });

      it('handles multiple root-level tasks with children', () => {
        const markdown = `- Root 1
  - Child 1.1
- Root 2
  - Child 2.1`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(4);
        expect(result.tasks[0].parentId).toBeUndefined(); // Root 1
        expect(result.tasks[1].parentId).toBe('plan-1-task-0'); // Child 1.1
        expect(result.tasks[2].parentId).toBeUndefined(); // Root 2
        expect(result.tasks[3].parentId).toBe('plan-1-task-2'); // Child 2.1
      });

      it('handles deeply nested structures', () => {
        const markdown = `- Level 0
  - Level 1
    - Level 2
      - Level 3
        - Level 4`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.parsedTasks).toHaveLength(5);
        expect(result.parsedTasks[4].depth).toBe(4);
        expect(result.tasks[4].parentId).toBe('plan-1-task-3');
      });

      it('handles jumping back up multiple levels', () => {
        const markdown = `- A
  - A.1
    - A.1.1
- B`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(4);
        expect(result.tasks[3].parentId).toBeUndefined(); // B is root level
        expect(result.tasks[3].content).toBe('B');
      });
    });

    describe('task IDs and sort order', () => {
      it('generates unique task IDs based on plan ID', () => {
        const markdown = `- Task 1
- Task 2`;

        const result = extractTasksFromMarkdown(markdown, 'my-plan');

        expect(result.tasks[0].id).toBe('my-plan-task-0');
        expect(result.tasks[1].id).toBe('my-plan-task-1');
      });

      it('assigns incrementing sort order', () => {
        const markdown = `- First
- Second
- Third`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks[0].sortOrder).toBe(0);
        expect(result.tasks[1].sortOrder).toBe(1);
        expect(result.tasks[2].sortOrder).toBe(2);
      });

      it('assigns planId to all tasks', () => {
        const markdown = `- Task A
  - Task B`;

        const result = extractTasksFromMarkdown(markdown, 'test-plan');

        expect(result.tasks[0].planId).toBe('test-plan');
        expect(result.tasks[1].planId).toBe('test-plan');
      });
    });

    describe('parsed task metadata', () => {
      it('includes raw line in parsed tasks', () => {
        const markdown = `- [ ] My task`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.parsedTasks[0].rawLine).toBe('- [ ] My task');
      });

      it('includes correct line numbers', () => {
        const markdown = `# Header

- First task
- Second task`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.parsedTasks).toHaveLength(2);
        expect(result.parsedTasks[0].lineNumber).toBe(3);
        expect(result.parsedTasks[1].lineNumber).toBe(4);
      });
    });

    describe('edge cases', () => {
      it('returns empty arrays for empty markdown', () => {
        const result = extractTasksFromMarkdown('', 'plan-1');

        expect(result.tasks).toEqual([]);
        expect(result.parsedTasks).toEqual([]);
      });

      it('returns empty arrays for markdown with no lists', () => {
        const markdown = `# Heading
This is just text.
No lists here.`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toEqual([]);
        expect(result.parsedTasks).toEqual([]);
      });

      it('ignores non-list lines mixed with lists', () => {
        const markdown = `# Tasks
- Task 1
Some explanation
- Task 2`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(2);
        expect(result.tasks[0].content).toBe('Task 1');
        expect(result.tasks[1].content).toBe('Task 2');
      });

      it('handles list items with special characters', () => {
        const markdown = `- Task with **bold** and \`code\`
- Task with [link](url)
- Task with emoji 🎉`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(3);
        expect(result.tasks[0].content).toBe('Task with **bold** and `code`');
        expect(result.tasks[1].content).toBe('Task with [link](url)');
        expect(result.tasks[2].content).toBe('Task with emoji 🎉');
      });

      it('trims whitespace from task content', () => {
        const markdown = `- [ ]    Extra spaces   `;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks[0].content).toBe('Extra spaces');
      });

      it('handles Windows line endings (CRLF)', () => {
        const markdown = `- Task 1\r\n- Task 2\r\n- Task 3`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(3);
      });

      it('handles numbered lists with high numbers', () => {
        const markdown = `99. Item 99
100. Item 100`;

        const result = extractTasksFromMarkdown(markdown, 'plan-1');

        expect(result.tasks).toHaveLength(2);
        expect(result.tasks[0].content).toBe('Item 99');
        expect(result.tasks[1].content).toBe('Item 100');
      });
    });

    describe('real-world examples', () => {
      it('parses a typical implementation plan', () => {
        const markdown = `## Implementation Plan

### Phase 1: Setup
- [x] Initialize project structure
- [x] Configure TypeScript
- [ ] Set up testing framework

### Phase 2: Core Features
- [ ] Implement user authentication
  - [ ] Add login form
  - [ ] Add registration form
  - [-] Implement JWT handling
- [ ] Create dashboard
  - [ ] Design layout
  - [ ] Add widgets`;

        const result = extractTasksFromMarkdown(markdown, 'impl-plan');

        expect(result.tasks).toHaveLength(10);

        // Check status distribution
        const completed = result.tasks.filter(t => t.status === 'completed');
        const inProgress = result.tasks.filter(t => t.status === 'in_progress');
        const pending = result.tasks.filter(t => t.status === 'pending');

        expect(completed).toHaveLength(2);
        expect(inProgress).toHaveLength(1);
        expect(pending).toHaveLength(7);

        // Check hierarchy
        const loginForm = result.tasks.find(t => t.content === 'Add login form');
        const userAuth = result.tasks.find(t => t.content === 'Implement user authentication');
        expect(loginForm?.parentId).toBe(userAuth?.id);
      });

      it('parses Claude Code style task lists', () => {
        const markdown = `## Tasks
- Create auth module
  - Add JWT validation
  - Add session storage
- Add middleware
- Write tests
  - Unit tests
  - Integration tests`;

        const result = extractTasksFromMarkdown(markdown, 'claude-plan');

        expect(result.tasks).toHaveLength(7);

        // Verify structure
        expect(result.tasks[0].content).toBe('Create auth module');
        expect(result.tasks[0].parentId).toBeUndefined();

        expect(result.tasks[1].content).toBe('Add JWT validation');
        expect(result.tasks[1].parentId).toBe('claude-plan-task-0');
      });
    });
  });

  describe('extractTaskContents', () => {
    it('returns array of task content strings', () => {
      const markdown = `- Task one
- Task two
- Task three`;

      const contents = extractTaskContents(markdown);

      expect(contents).toEqual(['Task one', 'Task two', 'Task three']);
    });

    it('handles checkboxes and returns clean content', () => {
      const markdown = `- [ ] Pending task
- [x] Done task`;

      const contents = extractTaskContents(markdown);

      expect(contents).toEqual(['Pending task', 'Done task']);
    });

    it('returns empty array for no tasks', () => {
      const markdown = `Just some text`;

      const contents = extractTaskContents(markdown);

      expect(contents).toEqual([]);
    });

    it('includes nested task content', () => {
      const markdown = `- Parent
  - Child`;

      const contents = extractTaskContents(markdown);

      expect(contents).toEqual(['Parent', 'Child']);
    });
  });

  describe('hasExtractableTasks', () => {
    it('returns true for markdown with lists', () => {
      const markdown = `- A task`;

      expect(hasExtractableTasks(markdown)).toBe(true);
    });

    it('returns true for ordered lists', () => {
      const markdown = `1. A numbered task`;

      expect(hasExtractableTasks(markdown)).toBe(true);
    });

    it('returns false for markdown without lists', () => {
      const markdown = `# Heading
Just text content.`;

      expect(hasExtractableTasks(markdown)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(hasExtractableTasks('')).toBe(false);
    });

    it('returns false for just whitespace', () => {
      expect(hasExtractableTasks('   \n\n   ')).toBe(false);
    });
  });

  describe('getTaskStats', () => {
    it('returns correct counts for mixed statuses', () => {
      const markdown = `- [ ] Pending 1
- [ ] Pending 2
- [-] In progress
- [x] Done 1
- [x] Done 2
- [x] Done 3`;

      const stats = getTaskStats(markdown);

      expect(stats.total).toBe(6);
      expect(stats.pending).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(3);
      expect(stats.progressPercent).toBe(50); // 3/6 = 50%
    });

    it('returns 0 progress for all pending', () => {
      const markdown = `- [ ] Task 1
- [ ] Task 2`;

      const stats = getTaskStats(markdown);

      expect(stats.progressPercent).toBe(0);
    });

    it('returns 100 progress for all completed', () => {
      const markdown = `- [x] Task 1
- [x] Task 2`;

      const stats = getTaskStats(markdown);

      expect(stats.progressPercent).toBe(100);
    });

    it('returns zeros for no tasks', () => {
      const markdown = `Just text`;

      const stats = getTaskStats(markdown);

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.progressPercent).toBe(0);
    });

    it('rounds progress percentage', () => {
      const markdown = `- [x] Done
- [ ] Pending
- [ ] Pending 2`;

      const stats = getTaskStats(markdown);

      expect(stats.progressPercent).toBe(33); // 1/3 = 33.33... rounds to 33
    });

    it('accepts custom plan ID', () => {
      const markdown = `- Task`;

      // Just verify it doesn't throw
      const stats = getTaskStats(markdown, 'custom-plan');

      expect(stats.total).toBe(1);
    });
  });
});
