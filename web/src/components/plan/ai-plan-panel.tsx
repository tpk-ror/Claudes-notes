"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LiveMarkdownEditor } from "./live-markdown-editor";
import { usePlanEditorStore } from "@/store/plan-editor-store";
import { writePlanFile, createPlanFile } from "@/lib/plan-file-api";
import { generatePlanFileName, extractPlanNameFromContent } from "@/lib/plan-file-utils";
import { CheckCircle, Circle, Clock, ListTodo } from "lucide-react";

export interface AiPlanPanelProps {
  projectPath: string;
  className?: string;
}

/**
 * Parse tasks from markdown content
 */
function parseTasks(content: string): Array<{
  id: string;
  text: string;
  completed: boolean;
  indent: number;
}> {
  const tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
    indent: number;
  }> = [];

  const lines = content.split("\n");
  let taskId = 0;

  for (const line of lines) {
    // Match task patterns: - [ ] or - [x] or * [ ] or * [x]
    const match = line.match(/^(\s*)([-*])\s+\[([ xX])\]\s+(.+)$/);
    if (match) {
      taskId++;
      const indent = match[1].length;
      const completed = match[3].toLowerCase() === "x";
      const text = match[4].trim();

      tasks.push({
        id: `task-${taskId}`,
        text,
        completed,
        indent: Math.floor(indent / 2),
      });
    }
  }

  return tasks;
}

/**
 * Task item component with shimmer animation during streaming
 */
function TaskItem({
  text,
  completed,
  indent,
  isStreaming,
}: {
  text: string;
  completed: boolean;
  indent: number;
  isStreaming?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 py-1.5 px-2 rounded-md transition-colors",
        completed && "text-muted-foreground line-through",
        isStreaming && "animate-shimmer"
      )}
      style={{ marginLeft: `${indent * 16}px` }}
    >
      {completed ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      )}
      <span className="text-sm">{text}</span>
    </div>
  );
}

/**
 * Task list component showing parsed tasks from plan content
 */
function TaskList({
  tasks,
  isStreaming,
}: {
  tasks: ReturnType<typeof parseTasks>;
  isStreaming?: boolean;
}) {
  if (tasks.length === 0) return null;

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ListTodo className="h-4 w-4" />
          <span>Tasks</span>
          <span className="text-muted-foreground">
            ({completedCount}/{tasks.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      </div>

      {/* Task list */}
      <div className="px-2 py-2 max-h-48 overflow-y-auto">
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            text={task.text}
            completed={task.completed}
            indent={task.indent}
            isStreaming={isStreaming && index === tasks.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * AI-integrated plan panel with task parsing and shimmer animations.
 * Extends EnhancedPlanPanel with AI SDK patterns.
 */
export function AiPlanPanel({ projectPath, className }: AiPlanPanelProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Plan editor store state
  const mode = usePlanEditorStore((state) => state.mode);
  const activeFileName = usePlanEditorStore((state) => state.activeFileName);
  const activeFilePath = usePlanEditorStore((state) => state.activeFilePath);
  const isStreaming = usePlanEditorStore((state) => state.isStreaming);
  const editorContent = usePlanEditorStore((state) => state.editorContent);
  const isDirty = usePlanEditorStore((state) => state.isDirty);
  const setEditorContent = usePlanEditorStore((state) => state.setEditorContent);
  const markSaved = usePlanEditorStore((state) => state.markSaved);
  const setMode = usePlanEditorStore((state) => state.setMode);
  const setActiveFile = usePlanEditorStore((state) => state.setActiveFile);

  // Parse tasks from content
  const tasks = React.useMemo(() => parseTasks(editorContent), [editorContent]);

  // Handle content changes
  const handleChange = React.useCallback(
    (content: string) => {
      setEditorContent(content);
    },
    [setEditorContent]
  );

  // Handle save
  const handleSave = React.useCallback(async () => {
    if (!projectPath || !isDirty || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      if (activeFileName && activeFilePath) {
        await writePlanFile(projectPath, activeFileName, editorContent);
        markSaved(editorContent);
      } else {
        const planName = extractPlanNameFromContent(editorContent) || "untitled";
        const newFileName = generatePlanFileName(planName);
        await createPlanFile(projectPath, planName, editorContent);
        setActiveFile(projectPath, newFileName, editorContent);
        markSaved(editorContent);
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [
    projectPath,
    isDirty,
    isSaving,
    activeFileName,
    activeFilePath,
    editorContent,
    markSaved,
    setActiveFile,
  ]);

  // Handle entering edit mode
  const handleEdit = React.useCallback(() => {
    setMode("editing");
  }, [setMode]);

  return (
    <div
      className={cn("flex flex-col h-full bg-background", className)}
      data-testid="ai-plan-panel"
    >
      {/* Error banner */}
      {saveError && (
        <div className="shrink-0 px-4 py-2 bg-destructive/10 text-destructive text-sm border-b border-destructive/20">
          <span>Error: {saveError}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-auto py-0 text-xs"
            onClick={() => setSaveError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Streaming shimmer overlay */}
      {isStreaming && (
        <div className="shrink-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer-bar" />
      )}

      {/* Main editor area */}
      <div className="flex-1 min-h-0">
        <LiveMarkdownEditor
          content={editorContent}
          onChange={handleChange}
          onSave={handleSave}
          mode={mode}
          isStreaming={isStreaming}
          isDirty={isDirty}
          fileName={activeFileName}
        />
      </div>

      {/* Task list (parsed from content) */}
      {tasks.length > 0 && !isStreaming && (
        <TaskList tasks={tasks} isStreaming={isStreaming} />
      )}

      {/* Footer with actions */}
      {mode === "viewing" && (
        <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            data-testid="edit-plan-btn"
          >
            Edit Plan
          </Button>
        </div>
      )}
    </div>
  );
}
