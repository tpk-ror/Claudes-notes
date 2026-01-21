"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { listPlanFiles, deletePlanFile } from "@/lib/plan-file-api";
import type { PlanFileInfo } from "@/types/plan-files";

export interface PlanFileListProps {
  /** Project path for loading plan files */
  projectPath: string;
  /** Called when a file is selected */
  onSelectFile: (file: PlanFileInfo) => void;
  /** Currently selected file name */
  selectedFileName?: string | null;
  /** Additional class names */
  className?: string;
}

/**
 * PlanFileList component displays plan files from /docs/plans.
 *
 * Features:
 * - Fetch files on mount and refresh
 * - Show file name, formatted date
 * - Click to select and load
 * - Delete button with confirmation
 */
export function PlanFileList({
  projectPath,
  onSelectFile,
  selectedFileName,
  className,
}: PlanFileListProps) {
  const [files, setFiles] = React.useState<PlanFileInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  // Load files on mount and when projectPath changes
  const loadFiles = React.useCallback(async () => {
    if (!projectPath) {
      setFiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const planFiles = await listPlanFiles(projectPath);
      setFiles(planFiles);
    } catch (err) {
      console.error("Error loading plan files:", err);
      setError(err instanceof Error ? err.message : "Failed to load files");
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath]);

  React.useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Handle file deletion
  const handleDelete = React.useCallback(
    async (fileName: string) => {
      if (deleteConfirm !== fileName) {
        setDeleteConfirm(fileName);
        return;
      }

      try {
        await deletePlanFile(projectPath, fileName);
        setFiles((prev) => prev.filter((f) => f.fileName !== fileName));
        setDeleteConfirm(null);
      } catch (err) {
        console.error("Error deleting file:", err);
        setError(err instanceof Error ? err.message : "Failed to delete file");
      }
    },
    [projectPath, deleteConfirm]
  );

  // Cancel delete confirmation when clicking elsewhere
  React.useEffect(() => {
    if (deleteConfirm) {
      const timeout = setTimeout(() => setDeleteConfirm(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [deleteConfirm]);

  // Format date for display
  const formatDate = (date: Date): string => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className={cn("p-3", className)} data-testid="plan-file-list-loading">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          Loading plans...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-3", className)} data-testid="plan-file-list-error">
        <div className="text-sm text-destructive">{error}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadFiles}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div
        className={cn("p-3 text-sm text-muted-foreground", className)}
        data-testid="plan-file-list-empty"
      >
        <p>No plan files yet.</p>
        <p className="text-xs mt-1">
          Plans will appear here when generated.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col", className)}
      data-testid="plan-file-list"
    >
      {files.map((file) => (
        <div
          key={file.fileName}
          className={cn(
            "group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
            "hover:bg-muted/50",
            selectedFileName === file.fileName && "bg-muted"
          )}
          onClick={() => onSelectFile(file)}
          data-testid={`plan-file-${file.fileName}`}
        >
          {/* File icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-muted-foreground"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {file.displayName.split(" (")[0]}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(file.modifiedAt)} at {formatTime(file.modifiedAt)}
            </div>
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
              deleteConfirm === file.fileName && "opacity-100 text-destructive"
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(file.fileName);
            }}
            data-testid={`delete-${file.fileName}`}
          >
            {deleteConfirm === file.fileName ? (
              <span className="text-xs">?</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            )}
          </Button>
        </div>
      ))}

      {/* Refresh button */}
      <div className="px-3 py-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={loadFiles}
          className="w-full text-xs"
          data-testid="refresh-files"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Refresh
        </Button>
      </div>
    </div>
  );
}
