import { create } from 'zustand';
import type { Message, ToolCall, ThinkingBlock } from './types';

interface MessageState {
  messages: Message[];
  isStreaming: boolean;
  streamingMessageId: string | null;
}

interface MessageActions {
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendToMessage: (id: string, content: string) => void;
  addToolCallToMessage: (messageId: string, toolCall: ToolCall) => void;
  updateToolCallResult: (
    messageId: string,
    toolCallId: string,
    result: string
  ) => void;
  addThinkingBlockToMessage: (
    messageId: string,
    thinkingBlock: ThinkingBlock
  ) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  getMessagesBySession: (sessionId: string) => Message[];
  setStreaming: (isStreaming: boolean, messageId?: string | null) => void;
  /** Sync a message from AI SDK to Zustand (upsert) */
  syncMessage: (message: Message) => void;
  /** Bulk sync messages from AI SDK to Zustand */
  syncMessages: (messages: Message[]) => void;
}

export type MessageStore = MessageState & MessageActions;

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingMessageId: null,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  appendToMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + content } : m
      ),
    })),

  addToolCallToMessage: (messageId, toolCall) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, toolCalls: [...(m.toolCalls || []), toolCall] }
          : m
      ),
    })),

  updateToolCallResult: (messageId, toolCallId, result) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              toolCalls: m.toolCalls?.map((tc) =>
                tc.id === toolCallId ? { ...tc, result } : tc
              ),
            }
          : m
      ),
    })),

  addThinkingBlockToMessage: (messageId, thinkingBlock) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              thinkingBlocks: [...(m.thinkingBlocks || []), thinkingBlock],
            }
          : m
      ),
    })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),

  clearMessages: () => set({ messages: [] }),

  getMessagesBySession: (sessionId) => {
    return get().messages.filter((m) => m.sessionId === sessionId);
  },

  setStreaming: (isStreaming, messageId = null) =>
    set({ isStreaming, streamingMessageId: messageId }),

  syncMessage: (message) =>
    set((state) => {
      const existingIndex = state.messages.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        // Update existing message
        const updated = [...state.messages];
        updated[existingIndex] = message;
        return { messages: updated };
      } else {
        // Add new message
        return { messages: [...state.messages, message] };
      }
    }),

  syncMessages: (messages) =>
    set((state) => {
      const messageMap = new Map(state.messages.map((m) => [m.id, m]));
      for (const message of messages) {
        messageMap.set(message.id, message);
      }
      return { messages: Array.from(messageMap.values()) };
    }),
}));
