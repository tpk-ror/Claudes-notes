"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LiveMarkdownEditor } from "@/components/plan/live-markdown-editor";
import { usePlanEditorStore } from "@/store/plan-editor-store";
import { writePlanFile, createPlanFile } from "@/lib/plan-file-api";
import { generatePlanFileName, extractPlanNameFromContent } from "@/lib/plan-file-utils";

export interface EnhancedPlanPanelProps {
  /** Project path for file operations */
  projectPath: string;
  /** Additional class names */
  className?: string;
}

/**
 * EnhancedPlanPanel provides the plan editor with file management.
 *
 * Features:
 * - Real-time markdown editing with preview
 * - Streaming support for plan generation
 * - Auto-save and manual save functionality
 * - File-based storage in /docs/plans
 */
export function EnhancedPlanPanel({
  projectPath,
  className,
}: EnhancedPlanPanelProps) {
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
        // Update existing file
        await writePlanFile(projectPath, activeFileName, editorContent);
        markSaved(editorContent);
      } else {
        // Create new file
        const planName = extractPlanNameFromContent(editorContent) || 'untitled';
        const newFileName = generatePlanFileName(planName);
        await createPlanFile(projectPath, planName, editorContent);

        // Update store with new file info
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
      data-testid="enhanced-plan-panel"
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
