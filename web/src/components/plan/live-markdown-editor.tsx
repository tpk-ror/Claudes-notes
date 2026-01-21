"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import type { PlanEditorMode } from "@/types/plan-files";

export interface LiveMarkdownEditorProps {
  /** Current editor content */
  content: string;
  /** Called when content changes (for editing mode) */
  onChange?: (content: string) => void;
  /** Called when save is triggered */
  onSave?: () => void;
  /** Current editor mode */
  mode: PlanEditorMode;
  /** Whether the content is being streamed */
  isStreaming?: boolean;
  /** Whether there are unsaved changes */
  isDirty?: boolean;
  /** The filename being edited */
  fileName?: string | null;
  /** Additional class names */
  className?: string;
}

/**
 * LiveMarkdownEditor component for viewing and editing plan markdown files.
 *
 * Features:
 * - Toggle between edit and preview modes
 * - Streaming indicator (pulsing cursor, "Generating..." badge)
 * - Auto-scroll to bottom during streaming
 * - Save button (Cmd/Ctrl+S shortcut)
 * - Syntax-aware editor (basic)
 */
export function LiveMarkdownEditor({
  content,
  onChange,
  onSave,
  mode,
  isStreaming = false,
  isDirty = false,
  fileName,
  className,
}: LiveMarkdownEditorProps) {
  const [viewMode, setViewMode] = React.useState<"edit" | "preview">("preview");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming
  React.useEffect(() => {
    if (isStreaming && previewRef.current) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  // Keyboard shortcut for save (Cmd/Ctrl+S)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (onSave && isDirty) {
          onSave();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSave, isDirty]);

  // Handle textarea changes
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    },
    [onChange]
  );

  // Render empty state
  if (mode === "empty") {
    return (
      <div
        className={cn(
          "flex flex-col h-full items-center justify-center text-muted-foreground p-8",
          className
        )}
        data-testid="live-editor-empty"
      >
        <div className="text-center space-y-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto opacity-50"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
          <p className="text-lg font-medium">No plan yet</p>
          <p className="text-sm">
            Start a conversation to generate a plan, or select an existing plan from the sidebar
          </p>
        </div>
      </div>
    );
  }

  const isEditable = mode === "editing" && !isStreaming;
  const showPreview = viewMode === "preview" || isStreaming || mode === "viewing";

  return (
    <div
      className={cn("flex flex-col h-full", className)}
      data-testid="live-markdown-editor"
    >
      {/* Header toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          {/* File indicator */}
          <span className="text-sm font-medium truncate max-w-[200px]">
            {fileName ? (
              <>
                <span className="text-muted-foreground">Plan:</span>{" "}
                <span className="text-foreground">{fileName.replace(/\.md$/, "")}</span>
              </>
            ) : (
              "New Plan"
            )}
          </span>

          {/* Streaming indicator */}
          {isStreaming && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
              Generating...
            </span>
          )}

          {/* Dirty indicator */}
          {isDirty && !isStreaming && (
            <span className="text-xs text-muted-foreground">(unsaved)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {mode === "editing" && !isStreaming && (
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("edit")}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  viewMode === "edit"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
                data-testid="edit-mode-btn"
              >
                Edit
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  viewMode === "preview"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
                data-testid="preview-mode-btn"
              >
                Preview
              </button>
            </div>
          )}

          {/* Save button */}
          {onSave && (
            <Button
              size="sm"
              variant={isDirty ? "default" : "outline"}
              onClick={onSave}
              disabled={!isDirty || isStreaming}
              data-testid="save-btn"
            >
              {isDirty ? "Save" : "Saved"}
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {showPreview ? (
          /* Preview mode */
          <div
            ref={previewRef}
            className="h-full overflow-y-auto p-4"
            data-testid="preview-content"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {content ? (
                <>
                  <MarkdownRenderer content={content} />
                  {/* Streaming cursor */}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                  )}
                </>
              ) : (
                <p className="text-muted-foreground italic">No content yet...</p>
              )}
            </div>
          </div>
        ) : (
          /* Edit mode */
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            className={cn(
              "w-full h-full p-4 font-mono text-sm resize-none",
              "bg-background text-foreground",
              "focus:outline-none focus:ring-0",
              "placeholder:text-muted-foreground"
            )}
            placeholder="Start writing your plan in markdown..."
            disabled={!isEditable}
            data-testid="editor-textarea"
          />
        )}
      </div>

      {/* Footer with keyboard hint */}
      <div className="shrink-0 px-4 py-1.5 border-t border-border bg-muted/20">
        <p className="text-xs text-muted-foreground">
          {isStreaming
            ? "Plan is being generated..."
            : mode === "editing"
            ? "Press Cmd/Ctrl+S to save"
            : "Click Edit to make changes"}
        </p>
      </div>
    </div>
  );
}
