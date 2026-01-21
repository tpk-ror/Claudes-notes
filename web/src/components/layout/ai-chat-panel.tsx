"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Loader } from "@/components/ai-elements/loader";
import { useCliChat, type ChatMessage, type ToolInvocation } from "@/hooks/use-cli-chat";
import {
  useSessionStore,
  useMessageStore,
  usePlanEditorStore,
  type Message as ZustandMessage,
} from "@/store";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";

export interface AiChatPanelProps {
  projectPath?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Map tool invocation status to AI SDK ToolUIPart state
 */
function mapToolStatus(status: ToolInvocation["status"]): "input-streaming" | "input-available" | "output-available" | "output-error" {
  switch (status) {
    case "pending":
      return "input-streaming";
    case "running":
      return "input-available";
    case "completed":
      return "output-available";
    case "error":
      return "output-error";
    default:
      return "input-available";
  }
}

/**
 * AI-integrated chat panel using ai-elements components.
 * Uses Conversation, Message, Reasoning, Tool components from Vercel AI Elements.
 */
export function AiChatPanel({
  projectPath = "/",
  placeholder = "Ask Claude to help plan your feature...",
  className,
}: AiChatPanelProps) {
  const [inputValue, setInputValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Session store for CLI session IDs
  const sessions = useSessionStore((state) => state.sessions);
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const createNewSession = useSessionStore((state) => state.createNewSession);
  const updateSession = useSessionStore((state) => state.updateSession);

  // Message store for Zustand sync
  const addMessage = useMessageStore((state) => state.addMessage);

  // Plan editor store
  const loadedPlanContext = usePlanEditorStore((state) => state.loadedPlanContext);
  const startStreaming = usePlanEditorStore((state) => state.startStreaming);
  const appendStreamContent = usePlanEditorStore((state) => state.appendStreamContent);
  const stopStreaming = usePlanEditorStore((state) => state.stopStreaming);
  const setActiveFile = usePlanEditorStore((state) => state.setActiveFile);
  const markSaved = usePlanEditorStore((state) => state.markSaved);

  // Get current session's CLI session ID
  const currentSession = currentSessionId
    ? sessions.find((s) => s.id === currentSessionId)
    : null;
  const initialCliSessionId = currentSession?.cliSessionId;

  // Initialize useCliChat hook
  const {
    messages,
    sendMessage,
    status,
    isStreaming,
    stop,
    activeReasoning,
    activeToolCalls,
  } = useCliChat({
    projectPath,
    initialCliSessionId,
    onSessionIdChange: (sessionId) => {
      if (currentSessionId) {
        updateSession(currentSessionId, { cliSessionId: sessionId });
      }
    },
    onPlanDetected: (fileName) => {
      console.log("[AiChatPanel] Plan detected:", fileName);
      startStreaming(fileName);
    },
    onPlanStream: (content) => {
      appendStreamContent(content);
    },
    onPlanComplete: async (content, fileName) => {
      setActiveFile(projectPath, fileName, content);
      markSaved(content);
      stopStreaming();
    },
    onMessageComplete: (message) => {
      if (!currentSessionId) return;
      const zustandMessage: ZustandMessage = {
        id: message.id,
        sessionId: currentSessionId,
        role: message.role as "user" | "assistant" | "system",
        content: message.content,
        timestamp: message.createdAt || new Date(),
        toolCalls: message.toolCalls?.map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.args,
          result: tc.result,
        })),
        thinkingBlocks: message.reasoning?.map((r) => ({
          id: r.id,
          content: r.content,
        })),
      };
      addMessage(zustandMessage);
    },
  });

  // Handle message submission
  const handleSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const content = inputValue.trim();
      if (!content || isStreaming) return;

      // Create session if needed
      let sessionId = currentSessionId;
      if (!sessionId) {
        const session = createNewSession({
          slug: `Session ${sessions.length + 1}`,
          projectPath,
          model: "claude-3-opus",
        });
        sessionId = session.id;
      }

      // Add user message to Zustand
      const userMessage: ZustandMessage = {
        id: crypto.randomUUID(),
        sessionId,
        role: "user",
        content,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // Clear input
      setInputValue("");

      // Send via useCliChat
      const planContext = loadedPlanContext
        ? { fileName: loadedPlanContext.fileName, content: loadedPlanContext.content }
        : undefined;

      await sendMessage(content, planContext);

      // Update session activity
      updateSession(sessionId, {
        lastActiveAt: new Date(),
        messageCount: (sessions.find((s) => s.id === sessionId)?.messageCount || 0) + 2,
      });
    },
    [
      inputValue,
      isStreaming,
      currentSessionId,
      createNewSession,
      sessions,
      projectPath,
      addMessage,
      loadedPlanContext,
      sendMessage,
      updateSession,
    ]
  );

  // Handle keyboard shortcut
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Get the last assistant message index
  const lastAssistantIndex = messages.reduce(
    (lastIdx, msg, idx) => (msg.role === "assistant" ? idx : lastIdx),
    -1
  );

  return (
    <div className={cn("flex flex-col h-full", className)} data-testid="ai-chat-panel">
      {/* Conversation container with auto-scroll */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="No messages yet"
              description="Start a conversation to see messages here"
            />
          ) : (
            messages.map((message, index) => {
              const isLatestAssistant = index === lastAssistantIndex;
              const isCurrentlyStreaming = isStreaming && isLatestAssistant;

              // Get reasoning and tools for this message
              const reasoning = isCurrentlyStreaming ? activeReasoning : message.reasoning;
              const tools = isCurrentlyStreaming ? activeToolCalls : message.toolCalls;

              return (
                <Message key={message.id} from={message.role}>
                  {/* Reasoning blocks */}
                  {message.role === "assistant" && reasoning && reasoning.length > 0 && (
                    <>
                      {reasoning.map((block) => (
                        <Reasoning
                          key={block.id}
                          isStreaming={isCurrentlyStreaming && !block.isComplete}
                          defaultOpen={isCurrentlyStreaming && !block.isComplete}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{block.content}</ReasoningContent>
                        </Reasoning>
                      ))}
                    </>
                  )}

                  {/* Message content */}
                  <MessageContent>
                    {message.role === "assistant" ? (
                      message.content ? (
                        <MessageResponse>{message.content}</MessageResponse>
                      ) : isCurrentlyStreaming ? (
                        <Loader />
                      ) : null
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </MessageContent>

                  {/* Tool calls */}
                  {message.role === "assistant" && tools && tools.length > 0 && (
                    <>
                      {tools.map((tool) => (
                        <Tool key={tool.id}>
                          <ToolHeader
                            title={tool.name}
                            type="tool-invocation"
                            state={mapToolStatus(tool.status)}
                          />
                          <ToolContent>
                            <ToolInput input={tool.args} />
                            {tool.result && (
                              <ToolOutput
                                output={tool.result}
                                errorText={tool.isError ? tool.result : undefined}
                              />
                            )}
                          </ToolContent>
                        </Tool>
                      ))}
                    </>
                  )}
                </Message>
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <div className="shrink-0 border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-md border border-input bg-background px-3 py-2",
              "text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[40px] max-h-[200px]"
            )}
          />

          {isStreaming ? (
            <Button type="button" variant="outline" onClick={stop}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
