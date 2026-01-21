"use client";

import * as React from "react";
import type { Message } from "@/store";
import { cn } from "@/lib/utils";
import { parseQuestionWithOptions } from "@/lib/option-parser";
import { StreamingIndicator } from "./streaming-indicator";
import { MarkdownRenderer } from "./markdown-renderer";
import { ThinkingBlockList } from "./thinking-block";
import { ToolCallCardList } from "./tool-call-card";
import { InteractiveOptions } from "./interactive-options";

export interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  /** Whether this is the latest assistant message (for showing interactive options) */
  isLatestAssistant?: boolean;
  /** Callback when user selects an option from interactive options */
  onOptionSelect?: (value: string) => void;
  className?: string;
}

/**
 * MessageItem component that displays a single message.
 * Supports streaming content with visual indicator.
 */
export function MessageItem({
  message,
  isStreaming = false,
  isLatestAssistant = false,
  onOptionSelect,
  className,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  // Parse for interactive options (only for non-streaming latest assistant messages)
  const parsedQuestion = React.useMemo(() => {
    if (!isAssistant || !isLatestAssistant || isStreaming) return null;
    return parseQuestionWithOptions(message.content);
  }, [isAssistant, isLatestAssistant, isStreaming, message.content]);

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        isUser && "items-end",
        isAssistant && "items-start",
        isSystem && "items-center",
        className
      )}
      data-testid={`message-${message.id}`}
      data-role={message.role}
    >
      {/* Role indicator */}
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          isUser && "text-primary",
          isAssistant && "text-muted-foreground",
          isSystem && "text-muted-foreground"
        )}
      >
        {message.role}
      </span>

      {/* Message bubble */}
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[85%]",
          isUser && "bg-primary text-primary-foreground",
          isAssistant && "bg-secondary text-secondary-foreground",
          isSystem && "bg-muted text-muted-foreground italic text-sm"
        )}
      >
        {/* Message content with streaming support */}
        {isAssistant ? (
          <div className="break-words">
            {isStreaming && message.content.length === 0 ? (
              <StreamingIndicator variant="block" />
            ) : (
              <>
                <MarkdownRenderer content={message.content} />
                {isStreaming && <StreamingIndicator variant="inline" />}
              </>
            )}
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {isStreaming && <StreamingIndicator variant="inline" />}
          </div>
        )}
      </div>

      {/* Tool calls display (if any) */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <ToolCallCardList
          toolCalls={message.toolCalls}
          className="w-full max-w-[85%]"
        />
      )}

      {/* Thinking blocks display (if any) */}
      {message.thinkingBlocks && message.thinkingBlocks.length > 0 && (
        <ThinkingBlockList
          blocks={message.thinkingBlocks}
          className="w-full max-w-[85%]"
        />
      )}

      {/* Timestamp */}
      <span className="text-xs text-muted-foreground">
        {formatTimestamp(message.timestamp)}
      </span>

      {/* Interactive options for questions */}
      {parsedQuestion && onOptionSelect && (
        <InteractiveOptions
          question={parsedQuestion}
          onSelect={onOptionSelect}
          className="w-full max-w-[85%] mt-2 p-3 bg-secondary/50 rounded-lg border border-border"
        />
      )}
    </div>
  );
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  // Handle both Date objects and date strings (from JSON)
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
