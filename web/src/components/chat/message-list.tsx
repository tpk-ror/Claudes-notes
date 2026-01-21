"use client";

import * as React from "react";
import { useMessageStore } from "@/store";
import { MessageItem } from "./message-item";
import { cn } from "@/lib/utils";

export interface MessageListProps {
  sessionId?: string;
  className?: string;
  /** Disable auto-scroll behavior (useful for testing) */
  disableAutoScroll?: boolean;
}

/** Threshold in pixels from bottom to consider "at bottom" for auto-scroll */
const SCROLL_THRESHOLD = 100;

/**
 * Check if the scroll container is near the bottom.
 * Returns true if the user has not scrolled up significantly.
 */
function isNearBottom(element: HTMLElement): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  return distanceFromBottom <= SCROLL_THRESHOLD;
}

/**
 * MessageList component that displays streaming messages with <50ms latency.
 * Uses Zustand store subscription for efficient updates.
 *
 * Auto-scroll behavior:
 * - Automatically scrolls to the bottom when new messages arrive
 * - Only auto-scrolls if the user is already near the bottom (sticky scroll)
 * - User can scroll up to read history; auto-scroll pauses until they return to bottom
 */
export function MessageList({ sessionId, className, disableAutoScroll = false }: MessageListProps) {
  // Get all messages from store (stable reference)
  const allMessages = useMessageStore((state) => state.messages);

  // Filter messages by sessionId if provided (memoized to prevent infinite loops)
  const messages = React.useMemo(
    () => sessionId
      ? allMessages.filter((m) => m.sessionId === sessionId)
      : allMessages,
    [allMessages, sessionId]
  );
  const isStreaming = useMessageStore((state) => state.isStreaming);
  const streamingMessageId = useMessageStore(
    (state) => state.streamingMessageId
  );

  // Ref for auto-scroll container
  const containerRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Track whether auto-scroll should be active (user is at bottom)
  const shouldAutoScrollRef = React.useRef(true);

  // Track previous message count to detect new messages
  const prevMessageCountRef = React.useRef(messages.length);

  // Handle scroll events to determine if auto-scroll should be active
  const handleScroll = React.useCallback(() => {
    if (containerRef.current) {
      shouldAutoScrollRef.current = isNearBottom(containerRef.current);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive or content updates (streaming)
  React.useEffect(() => {
    if (disableAutoScroll) return;

    const container = containerRef.current;
    const bottomElement = bottomRef.current;

    if (!container || !bottomElement) return;

    // Determine if we should scroll
    const hasNewMessage = messages.length > prevMessageCountRef.current;
    const shouldScroll = shouldAutoScrollRef.current || hasNewMessage;

    if (shouldScroll && typeof bottomElement.scrollIntoView === "function") {
      // Use instant scroll during streaming for responsiveness, smooth for new messages
      const behavior = isStreaming ? "instant" : "smooth";
      bottomElement.scrollIntoView({ behavior, block: "end" });

      // If we scrolled due to new message, ensure auto-scroll stays enabled
      if (hasNewMessage) {
        shouldAutoScrollRef.current = true;
      }
    }

    // Update previous message count
    prevMessageCountRef.current = messages.length;
  }, [messages, isStreaming, disableAutoScroll]);

  // Scroll to bottom immediately on initial mount with messages
  React.useEffect(() => {
    if (disableAutoScroll) return;

    const bottomElement = bottomRef.current;
    if (bottomElement && messages.length > 0 && typeof bottomElement.scrollIntoView === "function") {
      bottomElement.scrollIntoView({ behavior: "instant", block: "end" });
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableAutoScroll]);

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-muted-foreground",
          className
        )}
        data-testid="message-list-empty"
      >
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col gap-4 overflow-y-auto p-4", className)}
      data-testid="message-list"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      onScroll={handleScroll}
    >
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isStreaming={isStreaming && streamingMessageId === message.id}
        />
      ))}
      <div ref={bottomRef} aria-hidden="true" data-testid="message-list-bottom" />
    </div>
  );
}
