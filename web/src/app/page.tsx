"use client";

import * as React from "react";
import { CollapsibleSidebar } from "@/components/sidebar/collapsible-sidebar";
import { TwoPanelLayout, ChatPanel, EnhancedPlanPanel, AiChatPanel } from "@/components/layout";
import { AiPlanPanel } from "@/components/plan";
import { ThemeToggle } from "@/components/theme";
import { ContextIndicator } from "@/components/chat/context-indicator";
import { Button } from "@/components/ui/button";
import {
  useSessionStore,
  useMessageStore,
  usePlanStore,
  usePlanEditorStore,
  type Message,
} from "@/store";
import { detectPlanContent, extractPlanTitle, getMinDetectionLength, hasEarlyPlanIndicators } from "@/lib/plan-content-detector";
import { readPlanFile, createPlanFile } from "@/lib/plan-file-api";
import { generatePlanFileName, extractPlanNameFromContent } from "@/lib/plan-file-utils";
import type { PlanFileInfo } from "@/types/plan-files";

// Feature flag for AI Elements integration
// Set NEXT_PUBLIC_USE_AI_ELEMENTS=true in .env.local to enable
const USE_AI_ELEMENTS = process.env.NEXT_PUBLIC_USE_AI_ELEMENTS === "true";

// Default project path - in a real app this would come from user selection
const DEFAULT_PROJECT_PATH = process.cwd?.() || "/";

export default function Home() {
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [projectPath] = React.useState(DEFAULT_PROJECT_PATH);

  // Ref to track accumulated stream content for detection
  const streamAccumulatorRef = React.useRef<string>("");
  const isPlanStreamRef = React.useRef<boolean>(false);

  // Session store
  const sessions = useSessionStore((state) => state.sessions);
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const createNewSession = useSessionStore((state) => state.createNewSession);
  const setCurrentSession = useSessionStore((state) => state.setCurrentSession);
  const updateSession = useSessionStore((state) => state.updateSession);

  // Message store
  const addMessage = useMessageStore((state) => state.addMessage);
  const appendToMessage = useMessageStore((state) => state.appendToMessage);
  const setStoreStreaming = useMessageStore((state) => state.setStreaming);

  // Plan store (for existing plan management)
  const plans = usePlanStore((state) => state.plans);
  const getPlansBySession = usePlanStore((state) => state.getPlansBySession);

  // Plan editor store (for file-based plans)
  const planEditorMode = usePlanEditorStore((state) => state.mode);
  const activeFileName = usePlanEditorStore((state) => state.activeFileName);
  const loadedPlanContext = usePlanEditorStore((state) => state.loadedPlanContext);
  const startStreaming = usePlanEditorStore((state) => state.startStreaming);
  const appendStreamContent = usePlanEditorStore((state) => state.appendStreamContent);
  const stopStreaming = usePlanEditorStore((state) => state.stopStreaming);
  const setActiveFile = usePlanEditorStore((state) => state.setActiveFile);
  const clearActiveFile = usePlanEditorStore((state) => state.clearActiveFile);
  const clearLoadedPlanContext = usePlanEditorStore((state) => state.clearLoadedPlanContext);
  const markSaved = usePlanEditorStore((state) => state.markSaved);

  // Create a new session
  const handleNewSession = React.useCallback(() => {
    const session = createNewSession({
      slug: `Session ${sessions.length + 1}`,
      projectPath: projectPath,
      model: "claude-3-opus",
    });
    setCurrentSession(session.id);
    clearActiveFile();
  }, [createNewSession, sessions.length, setCurrentSession, projectPath, clearActiveFile]);

  // Handle streaming text - route to chat or plan editor
  const handleStreamText = React.useCallback(
    (text: string, assistantMessageId: string) => {
      // Accumulate for detection
      streamAccumulatorRef.current += text;
      const accumulated = streamAccumulatorRef.current;

      // Check if we should detect plan content
      if (!isPlanStreamRef.current && accumulated.length >= getMinDetectionLength()) {
        // Check for early indicators first (faster)
        if (hasEarlyPlanIndicators(accumulated)) {
          const detection = detectPlanContent(accumulated);
          if (detection.isPlanContent && detection.confidence >= 0.4) {
            console.log("[Chat] Plan content detected, routing to editor. Confidence:", detection.confidence);
            isPlanStreamRef.current = true;

            // Start streaming to plan editor
            const fileName = generatePlanFileName(detection.planTitle || 'plan');
            startStreaming(fileName);

            // Send accumulated content to plan editor
            appendStreamContent(accumulated);
            return;
          }
        }
      }

      // Route to appropriate destination
      if (isPlanStreamRef.current) {
        appendStreamContent(text);
      } else {
        appendToMessage(assistantMessageId, text);
      }
    },
    [appendToMessage, startStreaming, appendStreamContent]
  );

  // Handle sending a message
  const handleSubmitMessage = React.useCallback(
    async (content: string) => {
      // Create session if none exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        const session = createNewSession({
          slug: `Session ${sessions.length + 1}`,
          projectPath: projectPath,
          model: "claude-3-opus",
        });
        sessionId = session.id;
      }

      // Prepend plan context if available
      let messageToSend = content;
      if (loadedPlanContext) {
        messageToSend = `[Plan Context: ${loadedPlanContext.fileName}]\n\n${loadedPlanContext.content}\n\n---\n\nUser: ${content}`;
      }

      // Add user message (show original content, not with context)
      const userMessage: Message = {
        id: crypto.randomUUID(),
        sessionId,
        role: "user",
        content,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // Create placeholder for assistant response
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMessageId,
        sessionId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      addMessage(assistantMessage);

      // Reset stream tracking
      streamAccumulatorRef.current = "";
      isPlanStreamRef.current = false;

      setIsStreaming(true);
      setStoreStreaming(true, assistantMessageId);

      try {
        console.log("[Chat] Sending message to API:", content.slice(0, 100));

        // Get the CLI session ID for resuming (if it exists)
        const currentSession = sessions.find((s) => s.id === sessionId);
        const cliSessionId = currentSession?.cliSessionId;
        console.log("[Chat] CLI session ID for resume:", cliSessionId || "(new session)");

        // Call the streaming API
        const response = await fetch("/api/claude/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageToSend,
            sessionId: cliSessionId,
          }),
        });

        console.log("[Chat] Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          console.log("[Chat] Starting to read stream");
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("[Chat] Stream done");
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const event = JSON.parse(data);

                  // Handle Claude CLI stream-json events
                  if (event.type === "system" && event.subtype === "init" && event.session_id) {
                    console.log("[Chat] Received CLI session ID:", event.session_id);
                    updateSession(sessionId, { cliSessionId: event.session_id });
                  } else if (event.type === "result" && event.session_id && !event.is_error) {
                    console.log("[Chat] Received CLI session ID from result:", event.session_id);
                    updateSession(sessionId, { cliSessionId: event.session_id });
                  } else if (event.type === "assistant" && event.message?.content) {
                    // Extract text from content blocks (final message)
                    for (const block of event.message.content) {
                      if (block.type === "text" && block.text) {
                        handleStreamText(block.text, assistantMessageId);
                      }
                    }
                  } else if (event.type === "content_block_delta" && event.delta) {
                    // Handle streaming deltas
                    if (event.delta.type === "text_delta" && event.delta.text) {
                      handleStreamText(event.delta.text, assistantMessageId);
                    }
                  } else if (event.type === "error" || event.type === "spawn_error") {
                    console.error("[Chat] Error event:", event);
                    appendToMessage(
                      assistantMessageId,
                      `Error: ${event.message || "Unknown error"}`
                    );
                  } else if (event.type === "result" && event.is_error) {
                    const errorMsg = event.errors?.join(", ") || event.error || "Unknown error";
                    console.error("[Chat] Result error:", errorMsg);
                    appendToMessage(
                      assistantMessageId,
                      `Error: ${errorMsg}`
                    );
                  }
                } catch (parseError) {
                  // Non-JSON data
                  if (data.trim()) {
                    handleStreamText(data, assistantMessageId);
                  }
                }
              }
            }
          }
        }

        // Finalize streaming
        if (isPlanStreamRef.current) {
          // Save the plan file
          const planContent = streamAccumulatorRef.current;
          const planName = extractPlanTitle(planContent) || extractPlanNameFromContent(planContent) || 'untitled';

          try {
            const file = await createPlanFile(projectPath, planName, planContent);
            setActiveFile(projectPath, file.fileName, planContent, file);
            markSaved(planContent);
            console.log("[Chat] Plan saved:", file.fileName);
          } catch (saveError) {
            console.error("[Chat] Error saving plan:", saveError);
          }

          stopStreaming();
        }

        // Update session activity
        updateSession(sessionId, {
          lastActiveAt: new Date(),
          messageCount: (sessions.find((s) => s.id === sessionId)?.messageCount || 0) + 2,
        });
      } catch (error) {
        console.error("Stream error:", error);
        appendToMessage(
          assistantMessageId,
          "\n\n*Error: Failed to connect to Claude CLI. Make sure the Claude Code CLI is installed and authenticated.*"
        );
      } finally {
        setIsStreaming(false);
        setStoreStreaming(false);
        if (isPlanStreamRef.current) {
          stopStreaming();
        }
      }
    },
    [
      currentSessionId,
      createNewSession,
      sessions,
      projectPath,
      loadedPlanContext,
      addMessage,
      appendToMessage,
      updateSession,
      setStoreStreaming,
      startStreaming,
      appendStreamContent,
      stopStreaming,
      setActiveFile,
      markSaved,
      handleStreamText,
    ]
  );

  // Handle option selection from interactive options
  const handleOptionSelect = React.useCallback(
    (value: string) => {
      handleSubmitMessage(value);
    },
    [handleSubmitMessage]
  );

  // Handle plan file selection from sidebar
  const handleSelectPlanFile = React.useCallback(
    async (file: PlanFileInfo) => {
      try {
        const result = await readPlanFile(projectPath, file.fileName);
        setActiveFile(projectPath, file.fileName, result.content, result.file);
      } catch (error) {
        console.error("Error loading plan file:", error);
      }
    },
    [projectPath, setActiveFile]
  );

  // Handle clearing plan context
  const handleClearContext = React.useCallback(() => {
    clearLoadedPlanContext();
  }, [clearLoadedPlanContext]);

  return (
    <div className="flex h-screen bg-background">
      {/* Collapsible sidebar with session history and plan files */}
      <CollapsibleSidebar
        header={
          <div className="flex items-center gap-2">
            <span className="font-semibold">Sessions</span>
          </div>
        }
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSession}
        projectPath={projectPath}
        onSelectPlanFile={handleSelectPlanFile}
        selectedPlanFileName={activeFileName}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Claude&apos;s Notes</h1>
            {currentSessionId && (
              <span className="text-sm text-muted-foreground">
                {sessions.find((s) => s.id === currentSessionId)?.slug || "Untitled"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleNewSession}>
              New Session
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Two panel layout */}
        <div className="flex-1 overflow-hidden">
          <TwoPanelLayout
            leftPanel={
              <div className="flex flex-col h-full">
                {/* Context indicator above chat */}
                {loadedPlanContext && (
                  <ContextIndicator
                    context={loadedPlanContext}
                    onClear={handleClearContext}
                    className="mx-4 mt-2"
                  />
                )}
                {USE_AI_ELEMENTS ? (
                  /* AI SDK integrated chat panel */
                  <AiChatPanel
                    projectPath={projectPath}
                    placeholder={
                      loadedPlanContext
                        ? "Continue editing the plan..."
                        : "Ask Claude to help plan your feature..."
                    }
                  />
                ) : (
                  /* Legacy chat panel with manual streaming */
                  <ChatPanel
                    sessionId={currentSessionId || undefined}
                    onSubmitMessage={handleSubmitMessage}
                    disabled={isStreaming}
                    placeholder={
                      loadedPlanContext
                        ? "Continue editing the plan..."
                        : "Ask Claude to help plan your feature..."
                    }
                  />
                )}
              </div>
            }
            rightPanel={
              USE_AI_ELEMENTS ? (
                <AiPlanPanel projectPath={projectPath} />
              ) : (
                <EnhancedPlanPanel projectPath={projectPath} />
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
