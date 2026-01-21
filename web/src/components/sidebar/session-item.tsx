"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatSessionDate } from "@/lib/date-utils";
import type { Session } from "@/store";

export interface SessionItemProps {
  session: Session;
  isSelected?: boolean;
  onSelect?: (sessionId: string) => void;
  className?: string;
}

/**
 * SessionItem displays a single session in the history sidebar.
 * Shows the session slug/name, project path, and timestamp.
 */
export function SessionItem({
  session,
  isSelected = false,
  onSelect,
  className,
}: SessionItemProps) {
  const handleClick = React.useCallback(() => {
    onSelect?.(session.id);
  }, [onSelect, session.id]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect?.(session.id);
      }
    },
    [onSelect, session.id]
  );

  // Extract project name from path
  const projectName = getProjectName(session.projectPath);

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-md px-3 py-2 text-left transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-accent",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`session-item-${session.id}`}
      data-selected={isSelected}
      aria-selected={isSelected}
      role="option"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Session slug/name */}
          <div
            className={cn(
              "truncate text-sm font-medium",
              isSelected ? "text-accent-foreground" : "text-foreground"
            )}
            data-testid="session-item-name"
          >
            {session.slug || "Untitled Session"}
          </div>

          {/* Project path */}
          <div
            className="truncate text-xs text-muted-foreground"
            data-testid="session-item-project"
            title={session.projectPath}
          >
            {projectName}
          </div>
        </div>

        {/* Timestamp */}
        <div
          className="shrink-0 text-xs text-muted-foreground"
          data-testid="session-item-time"
        >
          {formatSessionDate(session.lastActiveAt)}
        </div>
      </div>

      {/* Message count indicator */}
      {session.messageCount > 0 && (
        <div
          className="mt-1 text-xs text-muted-foreground"
          data-testid="session-item-messages"
        >
          {session.messageCount} {session.messageCount === 1 ? "message" : "messages"}
        </div>
      )}
    </button>
  );
}

/**
 * Extract the project name from a file path
 */
function getProjectName(path: string): string {
  if (!path) return "Unknown Project";

  // Handle both Unix and Windows paths
  const parts = path.split(/[/\\]/);
  const lastPart = parts.filter(Boolean).pop();

  return lastPart || path;
}
