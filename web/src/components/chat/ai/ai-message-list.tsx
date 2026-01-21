"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage, ReasoningBlock, ToolInvocation } from "@/hooks/use-cli-chat";
import { AiMessageItem } from "./ai-message-item";

export interface AiMessageListProps {
  /** Messages from useCliChat hook */
  messages: ChatMessage[];
  /** Whether currently streaming */
  isStreaming?: boolean;
  /** Active reasoning blocks during streaming */
  activeReasoning?: ReasoningBlock[];
  /** Active tool calls during streaming */
  activeToolCalls?: ToolInvocation[];
  /** Custom class name */
  className?: string;
  /** Disable auto-scroll behavior (useful for testing) */
  disableAutoScroll?: boolean;
  /** Callback when user selects an option from interactive options */
  onOptionSelect?: (value: string) => void;
}

/** Threshold in pixels from bottom to consider "at bottom" for auto-scroll */
const SCROLL_THRESHOLD = 100;

/**
 * Check if the scroll container is near the bottom.
 */
function isNearBottom(element: HTMLElement): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  return distanceFromBottom <= SCROLL_THRESHOLD;
}

/**
 * AI-powered message list component using AI SDK patterns.
 * Provides auto-scrolling conversation display with support for
 * reasoning blocks, tool calls, and streaming states.
 */
export function AiMessageList({
  messages,
  isStreaming = false,
  activeReasoning = [],
  activeToolCalls = [],
  className,
  disableAutoScroll = false,
  onOptionSelect,
}: AiMessageListProps) {
  // Refs for auto-scroll
  const containerRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = React.useRef(true);
  const prevMessageCountRef = React.useRef(messages.length);

  // Handle scroll to determine if auto-scroll should be active
  const handleScroll = React.useCallback(() => {
    if (containerRef.current) {
      shouldAutoScrollRef.current = isNearBottom(containerRef.current);
    }
  }, []);

  // Auto-scroll when messages change or during streaming
  React.useEffect(() => {
    if (disableAutoScroll) return;

    const container = containerRef.current;
    const bottomElement = bottomRef.current;

    if (!container || !bottomElement) return;

    const hasNewMessage = messages.length > prevMessageCountRef.current;
    const shouldScroll = shouldAutoScrollRef.current || hasNewMessage;

    if (shouldScroll && typeof bottomElement.scrollIntoView === "function") {
      const behavior = isStreaming ? "instant" : "smooth";
      bottomElement.scrollIntoView({ behavior, block: "end" });

      if (hasNewMessage) {
        shouldAutoScrollRef.current = true;
      }
    }

    prevMessageCountRef.current = messages.length;
  }, [messages, isStreaming, disableAutoScroll]);

  // Initial scroll
  React.useEffect(() => {
    if (disableAutoScroll) return;

    const bottomElement = bottomRef.current;
    if (bottomElement && messages.length > 0 && typeof bottomElement.scrollIntoView === "function") {
      bottomElement.scrollIntoView({ behavior: "instant", block: "end" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableAutoScroll]);

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-muted-foreground",
          className
        )}
        data-testid="ai-message-list-empty"
      >
        No messages yet. Start a conversation!
      </div>
    );
  }

  // Determine the latest assistant message index
  const lastAssistantIndex = messages.reduce(
    (lastIdx, msg, idx) => (msg.role === "assistant" ? idx : lastIdx),
    -1
  );

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col gap-4 overflow-y-auto p-4", className)}
      data-testid="ai-message-list"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      onScroll={handleScroll}
    >
      {messages.map((message, index) => {
        const isLatestAssistant = index === lastAssistantIndex;
        const isCurrentlyStreaming = isStreaming && isLatestAssistant;

        return (
          <AiMessageItem
            key={message.id}
            message={message}
            isStreaming={isCurrentlyStreaming}
            isLatestAssistant={isLatestAssistant}
            activeReasoning={isCurrentlyStreaming ? activeReasoning : undefined}
            activeToolCalls={isCurrentlyStreaming ? activeToolCalls : undefined}
            onOptionSelect={onOptionSelect}
          />
        );
      })}
      <div ref={bottomRef} aria-hidden="true" data-testid="ai-message-list-bottom" />
    </div>
  );
}
