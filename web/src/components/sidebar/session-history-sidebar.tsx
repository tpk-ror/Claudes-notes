"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSessionStore, type Session } from "@/store";
import {
  type DateGroup,
  getDateGroup,
  getDateGroupLabel,
  DATE_GROUP_ORDER,
} from "@/lib/date-utils";
import { SessionHistoryGroup } from "./session-history-group";

export interface SessionHistorySidebarProps {
  className?: string;
  /** Optional override for sessions (useful for testing) */
  sessions?: Session[];
  /** Optional override for current session ID (useful for testing) */
  currentSessionId?: string | null;
  /** Optional callback when a session is selected */
  onSelectSession?: (sessionId: string) => void;
}

/**
 * Groups sessions by date relative to now
 */
function groupSessionsByDate(
  sessions: Session[],
  now: Date = new Date()
): Map<DateGroup, Session[]> {
  const groups = new Map<DateGroup, Session[]>();

  for (const session of sessions) {
    const group = getDateGroup(session.lastActiveAt, now);
    const existing = groups.get(group) || [];
    existing.push(session);
    groups.set(group, existing);
  }

  return groups;
}

/**
 * SessionHistorySidebar displays the session history grouped by date.
 * Groups include: Today, Yesterday, Previous 7 Days, Previous 30 Days, Older
 */
export function SessionHistorySidebar({
  className,
  sessions: sessionsProp,
  currentSessionId: currentSessionIdProp,
  onSelectSession: onSelectSessionProp,
}: SessionHistorySidebarProps) {
  // Get sessions from store if not provided via props
  const storeSessions = useSessionStore((state) => state.sessions);
  const storeCurrentSessionId = useSessionStore((state) => state.currentSessionId);
  const storeSetCurrentSession = useSessionStore((state) => state.setCurrentSession);

  const sessions = sessionsProp ?? storeSessions;
  const currentSessionId = currentSessionIdProp ?? storeCurrentSessionId;
  const handleSelectSession = onSelectSessionProp ?? storeSetCurrentSession;

  // Group sessions by date - memoized for performance
  const groupedSessions = React.useMemo(
    () => groupSessionsByDate(sessions),
    [sessions]
  );

  // Empty state
  if (sessions.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center p-4",
          className
        )}
        data-testid="session-history-sidebar-empty"
      >
        <p className="text-sm italic text-muted-foreground">
          No sessions yet
        </p>
      </div>
    );
  }

  return (
    <nav
      className={cn("flex h-full flex-col overflow-hidden", className)}
      data-testid="session-history-sidebar"
      aria-label="Session history"
    >
      {/* Scrollable session list */}
      <div className="flex-1 overflow-y-auto py-2">
        {DATE_GROUP_ORDER.map((groupKey) => {
          const groupSessions = groupedSessions.get(groupKey);
          if (!groupSessions || groupSessions.length === 0) {
            return null;
          }

          return (
            <SessionHistoryGroup
              key={groupKey}
              label={getDateGroupLabel(groupKey)}
              sessions={groupSessions}
              currentSessionId={currentSessionId}
              onSelectSession={handleSelectSession}
            />
          );
        })}
      </div>
    </nav>
  );
}
