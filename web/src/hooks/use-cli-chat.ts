"use client";

import * as React from "react";
import type { Message as AiMessage } from "ai";
import { createCliStreamFetch, type TransformedChunk } from "@/lib/ai-sdk-transport";
import {
  detectPlanContent,
  extractPlanTitle,
  getMinDetectionLength,
  hasEarlyPlanIndicators,
} from "@/lib/plan-content-detector";
import { generatePlanFileName, extractPlanNameFromContent } from "@/lib/plan-file-utils";
import { createPlanFile } from "@/lib/plan-file-api";

/**
 * Chat status following AI SDK conventions
 */
export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

/**
 * Tool call representation
 */
export interface ToolInvocation {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  status: "pending" | "running" | "completed" | "error";
}

/**
 * Reasoning/thinking block representation
 */
export interface ReasoningBlock {
  id: string;
  content: string;
  isComplete: boolean;
}

/**
 * Extended message with additional metadata
 */
export interface ChatMessage extends Omit<AiMessage, "toolInvocations"> {
  reasoning?: ReasoningBlock[];
  toolCalls?: ToolInvocation[];
}

/**
 * Options for useCliChat hook
 */
export interface UseCliChatOptions {
  /** Project path for CLI and plan file operations */
  projectPath?: string;
  /** Initial CLI session ID for resuming conversations */
  initialCliSessionId?: string;
  /** Callback when CLI session ID is received/updated */
  onSessionIdChange?: (sessionId: string) => void;
  /** Callback when plan content is detected */
  onPlanDetected?: (fileName: string) => void;
  /** Callback to stream content to plan editor */
  onPlanStream?: (content: string) => void;
  /** Callback when plan streaming completes */
  onPlanComplete?: (content: string, fileName: string) => void;
  /** Callback when a message is completed (for syncing to Zustand) */
  onMessageComplete?: (message: ChatMessage) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
}

/**
 * Return type for useCliChat hook
 */
export interface UseCliChatReturn {
  /** Current messages in the chat */
  messages: ChatMessage[];
  /** Send a new message */
  sendMessage: (content: string, planContext?: { fileName: string; content: string }) => Promise<void>;
  /** Current chat status */
  status: ChatStatus;
  /** Whether the chat is currently streaming */
  isStreaming: boolean;
  /** Stop the current stream */
  stop: () => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Current error message if any */
  error: string | null;
  /** Current CLI session ID */
  cliSessionId: string | null;
  /** Current reasoning blocks (for active message) */
  activeReasoning: ReasoningBlock[];
  /** Current tool calls (for active message) */
  activeToolCalls: ToolInvocation[];
}

/**
 * Custom hook that bridges AI SDK patterns with Claude CLI subprocess.
 *
 * Features:
 * - Streams from /api/claude/stream endpoint
 * - Captures CLI session ID for --resume functionality
 * - Detects and routes plan content to plan editor
 * - Tracks reasoning/thinking blocks
 * - Tracks tool calls with status
 * - Syncs completed messages to Zustand
 */
export function useCliChat(options: UseCliChatOptions = {}): UseCliChatReturn {
  const {
    projectPath = "/",
    initialCliSessionId,
    onSessionIdChange,
    onPlanDetected,
    onPlanStream,
    onPlanComplete,
    onMessageComplete,
    onError,
  } = options;

  // State
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [status, setStatus] = React.useState<ChatStatus>("ready");
  const [error, setError] = React.useState<string | null>(null);
  const [cliSessionId, setCliSessionId] = React.useState<string | null>(initialCliSessionId || null);
  const [activeReasoning, setActiveReasoning] = React.useState<ReasoningBlock[]>([]);
  const [activeToolCalls, setActiveToolCalls] = React.useState<ToolInvocation[]>([]);

  // Refs for streaming state
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const streamAccumulatorRef = React.useRef<string>("");
  const isPlanStreamRef = React.useRef<boolean>(false);
  const currentMessageIdRef = React.useRef<string | null>(null);
  const reasoningIdCounterRef = React.useRef<number>(0);

  // Update CLI session ID
  const handleSessionIdUpdate = React.useCallback(
    (sessionId: string) => {
      setCliSessionId(sessionId);
      onSessionIdChange?.(sessionId);
    },
    [onSessionIdChange]
  );

  // Handle reasoning content
  const handleReasoning = React.useCallback((content: string, isComplete: boolean) => {
    setActiveReasoning((prev) => {
      const lastBlock = prev[prev.length - 1];
      if (lastBlock && !lastBlock.isComplete) {
        // Append to existing block
        const updated = [...prev];
        updated[prev.length - 1] = {
          ...lastBlock,
          content: lastBlock.content + content,
          isComplete,
        };
        return updated;
      } else {
        // Create new block
        reasoningIdCounterRef.current += 1;
        return [
          ...prev,
          {
            id: `reasoning-${reasoningIdCounterRef.current}`,
            content,
            isComplete,
          },
        ];
      }
    });
  }, []);

  // Handle tool call start
  const handleToolCallStart = React.useCallback(
    (id: string, name: string, args: Record<string, unknown>) => {
      setActiveToolCalls((prev) => [
        ...prev,
        {
          id,
          name,
          args,
          status: "running",
        },
      ]);
    },
    []
  );

  // Handle tool result
  const handleToolResult = React.useCallback(
    (id: string, result: string, isError: boolean) => {
      setActiveToolCalls((prev) =>
        prev.map((tc) =>
          tc.id === id
            ? {
                ...tc,
                result,
                isError,
                status: isError ? "error" : "completed",
              }
            : tc
        )
      );
    },
    []
  );

  // Stop current stream
  const stop = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("ready");
  }, []);

  // Clear all messages
  const clearMessages = React.useCallback(() => {
    setMessages([]);
    setActiveReasoning([]);
    setActiveToolCalls([]);
    setError(null);
  }, []);

  // Send a message
  const sendMessage = React.useCallback(
    async (content: string, planContext?: { fileName: string; content: string }) => {
      // Prepare message content
      let messageToSend = content;
      if (planContext) {
        messageToSend = `[Plan Context: ${planContext.fileName}]\n\n${planContext.content}\n\n---\n\nUser: ${content}`;
      }

      // Add user message
      const userMessageId = crypto.randomUUID();
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: "user",
        content,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Add assistant placeholder
      const assistantMessageId = crypto.randomUUID();
      currentMessageIdRef.current = assistantMessageId;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        reasoning: [],
        toolCalls: [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Reset streaming state
      streamAccumulatorRef.current = "";
      isPlanStreamRef.current = false;
      setActiveReasoning([]);
      setActiveToolCalls([]);
      setError(null);
      setStatus("submitted");

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        setStatus("streaming");

        const streamFetch = createCliStreamFetch({
          cliSessionId: cliSessionId || undefined,
          projectPath,
          onSessionInit: handleSessionIdUpdate,
          onError: (err) => {
            setError(err);
            onError?.(err);
          },
          onReasoning: handleReasoning,
          onToolCallStart: handleToolCallStart,
          onToolResult: handleToolResult,
        });

        await streamFetch(messageToSend, (chunk: TransformedChunk) => {
          // Handle session ID
          if (chunk.sessionId) {
            handleSessionIdUpdate(chunk.sessionId);
          }

          // Handle text content
          if (chunk.text && !chunk.isReasoning) {
            // Accumulate for plan detection
            streamAccumulatorRef.current += chunk.text;
            const accumulated = streamAccumulatorRef.current;

            // Check for plan content detection
            if (!isPlanStreamRef.current && accumulated.length >= getMinDetectionLength()) {
              if (hasEarlyPlanIndicators(accumulated)) {
                const detection = detectPlanContent(accumulated);
                if (detection.isPlanContent && detection.confidence >= 0.4) {
                  console.log("[useCliChat] Plan content detected, routing to editor");
                  isPlanStreamRef.current = true;

                  const fileName = generatePlanFileName(detection.planTitle || "plan");
                  onPlanDetected?.(fileName);
                  onPlanStream?.(accumulated);
                  return;
                }
              }
            }

            // Route to appropriate destination
            if (isPlanStreamRef.current) {
              onPlanStream?.(chunk.text);
            } else {
              // Update assistant message content
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + chunk.text }
                    : msg
                )
              );
            }
          }

          // Handle errors
          if (chunk.error) {
            setError(chunk.error);
            onError?.(chunk.error);
          }

          // Handle completion
          if (chunk.isComplete) {
            // Finalize plan if streaming to plan editor
            if (isPlanStreamRef.current && projectPath) {
              const planContent = streamAccumulatorRef.current;
              const planName =
                extractPlanTitle(planContent) ||
                extractPlanNameFromContent(planContent) ||
                "untitled";

              createPlanFile(projectPath, planName, planContent)
                .then((file) => {
                  onPlanComplete?.(planContent, file.fileName);
                  console.log("[useCliChat] Plan saved:", file.fileName);
                })
                .catch((saveError) => {
                  console.error("[useCliChat] Error saving plan:", saveError);
                });
            }

            // Get final message and sync to Zustand
            setMessages((prev) => {
              const finalMessage = prev.find((m) => m.id === assistantMessageId);
              if (finalMessage) {
                const completeMessage: ChatMessage = {
                  ...finalMessage,
                  reasoning: activeReasoning,
                  toolCalls: activeToolCalls,
                };
                onMessageComplete?.(completeMessage);
              }
              return prev;
            });

            setStatus("ready");
          }
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        onError?.(errorMessage);
        setStatus("error");

        // Update message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    msg.content +
                    "\n\n*Error: Failed to connect to Claude CLI. Make sure the Claude Code CLI is installed and authenticated.*",
                }
              : msg
          )
        );
      } finally {
        currentMessageIdRef.current = null;
        abortControllerRef.current = null;
      }
    },
    [
      cliSessionId,
      projectPath,
      handleSessionIdUpdate,
      handleReasoning,
      handleToolCallStart,
      handleToolResult,
      activeReasoning,
      activeToolCalls,
      onPlanDetected,
      onPlanStream,
      onPlanComplete,
      onMessageComplete,
      onError,
    ]
  );

  return {
    messages,
    sendMessage,
    status,
    isStreaming: status === "streaming" || status === "submitted",
    stop,
    clearMessages,
    error,
    cliSessionId,
    activeReasoning,
    activeToolCalls,
  };
}
