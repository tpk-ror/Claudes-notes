"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";

export interface ChatPanelProps {
  /** Current session ID for filtering messages */
  sessionId?: string;
  /** Called when user submits a message */
  onSubmitMessage: (message: string) => void;
  /** Whether the chat input should be disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Placeholder text for the input */
  placeholder?: string;
}

/**
 * ChatPanel combines MessageList and ChatInput into a complete chat interface.
 *
 * Features:
 * - Displays streaming messages with auto-scroll
 * - Multi-line input with Enter to submit, Shift+Enter for new line
 * - Flexible layout that fills available space
 */
export function ChatPanel({
  sessionId,
  onSubmitMessage,
  disabled = false,
  className,
  placeholder,
}: ChatPanelProps) {
  return (
    <div
      className={cn("flex flex-col h-full", className)}
      data-testid="chat-panel"
    >
      {/* Message list fills available space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList sessionId={sessionId} className="h-full" />
      </div>

      {/* Input fixed at bottom with padding */}
      <div className="shrink-0 border-t border-border p-4">
        <ChatInput
          onSubmit={onSubmitMessage}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
