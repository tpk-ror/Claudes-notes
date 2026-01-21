"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Session } from "@/store";
import { SessionItem } from "./session-item";

export interface SessionHistoryGroupProps {
  label: string;
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession?: (sessionId: string) => void;
  className?: string;
}

/**
 * SessionHistoryGroup displays a group of sessions under a date label.
 * Sessions are displayed in reverse chronological order (most recent first).
 */
export function SessionHistoryGroup({
  label,
  sessions,
  currentSessionId,
  onSelectSession,
  className,
}: SessionHistoryGroupProps) {
  // Sort sessions by lastActiveAt descending (most recent first)
  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort(
      (a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime()
    );
  }, [sessions]);

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("space-y-1", className)}
      data-testid="session-history-group"
    >
      {/* Group label */}
      <div
        className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        data-testid="session-group-label"
      >
        {label}
      </div>

      {/* Session list */}
      <div
        role="listbox"
        aria-label={`Sessions from ${label}`}
        className="space-y-0.5"
      >
        {sortedSessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            isSelected={session.id === currentSessionId}
            onSelect={onSelectSession}
          />
        ))}
      </div>
    </div>
  );
}
