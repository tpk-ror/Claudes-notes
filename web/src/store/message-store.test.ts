import { describe, it, expect, beforeEach } from 'vitest';
import { useMessageStore } from './message-store';
import type { Message, ToolCall, ThinkingBlock } from './types';

const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  sessionId: 'session-1',
  role: 'user',
  content: 'Hello, Claude!',
  timestamp: new Date('2026-01-19T10:00:00Z'),
  ...overrides,
});

const createMockToolCall = (overrides: Partial<ToolCall> = {}): ToolCall => ({
  id: 'tc-1',
  name: 'read_file',
  arguments: { path: '/test.txt' },
  ...overrides,
});

const createMockThinkingBlock = (overrides: Partial<ThinkingBlock> = {}): ThinkingBlock => ({
  id: 'tb-1',
  content: 'Thinking about the problem...',
  ...overrides,
});

describe('useMessageStore', () => {
  beforeEach(() => {
    useMessageStore.setState({
      messages: [],
      isStreaming: false,
      streamingMessageId: null,
    });
  });

  describe('initial state', () => {
    it('should have empty messages array', () => {
      expect(useMessageStore.getState().messages).toEqual([]);
    });

    it('should have isStreaming as false', () => {
      expect(useMessageStore.getState().isStreaming).toBe(false);
    });

    it('should have streamingMessageId as null', () => {
      expect(useMessageStore.getState().streamingMessageId).toBeNull();
    });
  });

  describe('setMessages', () => {
    it('should set messages array', () => {
      const messages = [createMockMessage(), createMockMessage({ id: 'msg-2' })];
      useMessageStore.getState().setMessages(messages);
      expect(useMessageStore.getState().messages).toEqual(messages);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the array', () => {
      const message = createMockMessage();
      useMessageStore.getState().addMessage(message);
      expect(useMessageStore.getState().messages).toContainEqual(message);
    });
  });

  describe('updateMessage', () => {
    it('should update a message by id', () => {
      const message = createMockMessage();
      useMessageStore.getState().addMessage(message);
      useMessageStore.getState().updateMessage('msg-1', { content: 'Updated content' });
      expect(useMessageStore.getState().messages[0].content).toBe('Updated content');
    });
  });

  describe('appendToMessage', () => {
    it('should append content to a message', () => {
      const message = createMockMessage({ content: 'Hello' });
      useMessageStore.getState().addMessage(message);
      useMessageStore.getState().appendToMessage('msg-1', ' World!');
      expect(useMessageStore.getState().messages[0].content).toBe('Hello World!');
    });
  });

  describe('addToolCallToMessage', () => {
    it('should add a tool call to a message', () => {
      const message = createMockMessage();
      const toolCall = createMockToolCall();
      useMessageStore.getState().addMessage(message);
      useMessageStore.getState().addToolCallToMessage('msg-1', toolCall);
      expect(useMessageStore.getState().messages[0].toolCalls).toContainEqual(toolCall);
    });

    it('should append to existing tool calls', () => {
      const message = createMockMessage({ toolCalls: [createMockToolCall({ id: 'tc-1' })] });
      useMessageStore.getState().addMessage(message);
      useMessageStore.getState().addToolCallToMessage('msg-1', createMockToolCall({ id: 'tc-2' }));
      expect(useMessageStore.getState().messages[0].toolCalls).toHaveLength(2);
    });
  });

  describe('updateToolCallResult', () => {
    it('should update tool call result', () => {
      const toolCall = createMockToolCall();
      const message = createMockMessage({ toolCalls: [toolCall] });
      useMessageStore.getState().addMessage(message);
      useMessageStore.getState().updateToolCallResult('msg-1', 'tc-1', 'File content here');
      expect(useMessageStore.getState().messages[0].toolCalls?.[0].result).toBe('File content here');
    });
  });

  describe('addThinkingBlockToMessage', () => {
    it('should add a thinking block to a message', () => {
      const message = createMockMessage();
      const thinkingBlock = createMockThinkingBlock();
      useMessageStore.getState().addMessage(message);
      useMessageStore.getState().addThinkingBlockToMessage('msg-1', thinkingBlock);
      expect(useMessageStore.getState().messages[0].thinkingBlocks).toContainEqual(thinkingBlock);
    });
  });

  describe('removeMessage', () => {
    it('should remove a message by id', () => {
      const message = createMockMessage();
      useMessageStore.getState().addMessage(message);
      useMessageStore.getState().removeMessage('msg-1');
      expect(useMessageStore.getState().messages).toHaveLength(0);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      useMessageStore.getState().setMessages([createMockMessage(), createMockMessage({ id: 'msg-2' })]);
      useMessageStore.getState().clearMessages();
      expect(useMessageStore.getState().messages).toHaveLength(0);
    });
  });

  describe('getMessagesBySession', () => {
    it('should return messages for a specific session', () => {
      const messages = [
        createMockMessage({ id: 'msg-1', sessionId: 'session-1' }),
        createMockMessage({ id: 'msg-2', sessionId: 'session-2' }),
        createMockMessage({ id: 'msg-3', sessionId: 'session-1' }),
      ];
      useMessageStore.getState().setMessages(messages);
      const sessionMessages = useMessageStore.getState().getMessagesBySession('session-1');
      expect(sessionMessages).toHaveLength(2);
      expect(sessionMessages.every(m => m.sessionId === 'session-1')).toBe(true);
    });
  });

  describe('setStreaming', () => {
    it('should set streaming state', () => {
      useMessageStore.getState().setStreaming(true, 'msg-1');
      expect(useMessageStore.getState().isStreaming).toBe(true);
      expect(useMessageStore.getState().streamingMessageId).toBe('msg-1');
    });

    it('should clear streaming message id when not streaming', () => {
      useMessageStore.getState().setStreaming(true, 'msg-1');
      useMessageStore.getState().setStreaming(false);
      expect(useMessageStore.getState().isStreaming).toBe(false);
      expect(useMessageStore.getState().streamingMessageId).toBeNull();
    });
  });
});
