// Tests for stream-json parser
import { describe, it, expect } from 'vitest';
import {
  parseStreamLine,
  parseStreamOutput,
  isSystemInitEvent,
  isAssistantMessageEvent,
  isContentBlockDeltaEvent,
  isContentBlockStartEvent,
  isContentBlockStopEvent,
  isToolUseEvent,
  isToolResultEvent,
  isMessageStartEvent,
  isMessageDeltaEvent,
  isMessageStopEvent,
  isResultSuccessEvent,
  isResultErrorEvent,
  isUserMessageEvent,
  isTextDelta,
  isToolInputDelta,
  isThinkingDelta,
  isTextBlock,
  isToolUseBlock,
  isThinkingBlockContent,
  type StreamEvent,
  type ContentBlockDeltaEvent,
  type ContentBlock,
} from './stream-parser';

describe('parseStreamLine', () => {
  describe('parsing valid JSON', () => {
    it('parses system init event', () => {
      const line = JSON.stringify({
        type: 'system',
        subtype: 'init',
        session_id: 'abc-123',
        cwd: '/home/user/project',
        model: 'claude-3-opus',
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('system');
        expect(isSystemInitEvent(result.event)).toBe(true);
      }
    });

    it('parses assistant message event', () => {
      const line = JSON.stringify({
        type: 'assistant',
        message: {
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello!' }],
          model: 'claude-3-opus',
          stop_reason: null,
          stop_sequence: null,
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        session_id: 'abc-123',
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('assistant');
        expect(isAssistantMessageEvent(result.event)).toBe(true);
      }
    });

    it('parses content_block_delta event with text delta', () => {
      const line = JSON.stringify({
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: 'Hello',
        },
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('content_block_delta');
        expect(isContentBlockDeltaEvent(result.event)).toBe(true);
      }
    });

    it('parses content_block_delta event with tool input delta', () => {
      const line = JSON.stringify({
        type: 'content_block_delta',
        index: 1,
        delta: {
          type: 'input_json_delta',
          partial_json: '{"file_path": "/src',
        },
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('content_block_delta');
      }
    });

    it('parses content_block_delta event with thinking delta', () => {
      const line = JSON.stringify({
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'thinking_delta',
          thinking: 'Let me think about this...',
        },
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('content_block_delta');
      }
    });

    it('parses content_block_start event', () => {
      const line = JSON.stringify({
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'text',
          text: '',
        },
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('content_block_start');
        expect(isContentBlockStartEvent(result.event)).toBe(true);
      }
    });

    it('parses content_block_stop event', () => {
      const line = JSON.stringify({
        type: 'content_block_stop',
        index: 0,
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('content_block_stop');
        expect(isContentBlockStopEvent(result.event)).toBe(true);
      }
    });

    it('parses tool_use event', () => {
      const line = JSON.stringify({
        type: 'tool_use',
        tool: {
          id: 'tool_123',
          name: 'Read',
          input: { file_path: '/src/index.ts' },
        },
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('tool_use');
        expect(isToolUseEvent(result.event)).toBe(true);
      }
    });

    it('parses tool_result event', () => {
      const line = JSON.stringify({
        type: 'tool_result',
        tool_use_id: 'tool_123',
        content: 'File contents here...',
        is_error: false,
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('tool_result');
        expect(isToolResultEvent(result.event)).toBe(true);
      }
    });

    it('parses message_start event', () => {
      const line = JSON.stringify({
        type: 'message_start',
        message: {
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [],
          model: 'claude-3-opus',
          stop_reason: null,
          stop_sequence: null,
          usage: {
            input_tokens: 100,
            output_tokens: 0,
          },
        },
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('message_start');
        expect(isMessageStartEvent(result.event)).toBe(true);
      }
    });

    it('parses message_delta event', () => {
      const line = JSON.stringify({
        type: 'message_delta',
        delta: {
          stop_reason: 'end_turn',
          stop_sequence: null,
        },
        usage: {
          output_tokens: 150,
        },
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('message_delta');
        expect(isMessageDeltaEvent(result.event)).toBe(true);
      }
    });

    it('parses message_stop event', () => {
      const line = JSON.stringify({
        type: 'message_stop',
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('message_stop');
        expect(isMessageStopEvent(result.event)).toBe(true);
      }
    });

    it('parses result success event', () => {
      const line = JSON.stringify({
        type: 'result',
        subtype: 'success',
        cost_usd: 0.05,
        duration_ms: 5000,
        duration_api_ms: 4500,
        is_error: false,
        num_turns: 1,
        result: 'Task completed successfully',
        session_id: 'abc-123',
        total_cost_usd: 0.10,
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('result');
        expect(isResultSuccessEvent(result.event)).toBe(true);
        expect(isResultErrorEvent(result.event)).toBe(false);
      }
    });

    it('parses result error event', () => {
      const line = JSON.stringify({
        type: 'result',
        subtype: 'error',
        error: 'Connection timeout',
        is_error: true,
        session_id: 'abc-123',
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('result');
        expect(isResultErrorEvent(result.event)).toBe(true);
        expect(isResultSuccessEvent(result.event)).toBe(false);
      }
    });

    it('parses user message event', () => {
      const line = JSON.stringify({
        type: 'user',
        message: {
          role: 'user',
          content: 'Hello, Claude!',
        },
        session_id: 'abc-123',
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('user');
        expect(isUserMessageEvent(result.event)).toBe(true);
      }
    });

    it('parses user message event with content array', () => {
      const line = JSON.stringify({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'text', text: 'Hello!' }],
        },
      });

      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.event.type).toBe('user');
      }
    });
  });

  describe('parsing invalid input', () => {
    it('returns error for empty line', () => {
      const result = parseStreamLine('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Empty line');
      }
    });

    it('returns error for whitespace-only line', () => {
      const result = parseStreamLine('   \t  ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Empty line');
      }
    });

    it('returns error for invalid JSON', () => {
      const result = parseStreamLine('not valid json');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unexpected token');
        expect(result.rawLine).toBe('not valid json');
      }
    });

    it('returns error for JSON without type field', () => {
      const result = parseStreamLine('{"foo": "bar"}');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Missing or invalid type field');
      }
    });

    it('returns error for JSON with non-string type', () => {
      const result = parseStreamLine('{"type": 123}');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Missing or invalid type field');
      }
    });

    it('returns error for non-object JSON', () => {
      const result = parseStreamLine('"just a string"');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Parsed value is not an object');
      }
    });

    it('returns error for JSON array', () => {
      const result = parseStreamLine('[1, 2, 3]');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Missing or invalid type field');
      }
    });

    it('returns error for JSON null', () => {
      const result = parseStreamLine('null');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Parsed value is not an object');
      }
    });
  });

  describe('parsing lines with whitespace', () => {
    it('handles leading whitespace', () => {
      const line = '  {"type": "message_stop"}';
      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
    });

    it('handles trailing whitespace', () => {
      const line = '{"type": "message_stop"}  \n';
      const result = parseStreamLine(line);
      expect(result.success).toBe(true);
    });
  });
});

describe('parseStreamOutput', () => {
  it('parses multiple lines of output', () => {
    const output = [
      JSON.stringify({ type: 'system', subtype: 'init', session_id: 'abc' }),
      JSON.stringify({ type: 'message_start', message: { id: 'msg1', type: 'message', role: 'assistant', content: [], model: 'claude', stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } }),
      JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hi' } }),
      JSON.stringify({ type: 'message_stop' }),
    ].join('\n');

    const results = parseStreamOutput(output);
    expect(results).toHaveLength(4);
    expect(results.every(r => r.success)).toBe(true);
  });

  it('filters out empty lines', () => {
    const output = [
      JSON.stringify({ type: 'message_start', message: { id: 'msg1', type: 'message', role: 'assistant', content: [], model: 'claude', stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } }),
      '',
      JSON.stringify({ type: 'message_stop' }),
      '',
    ].join('\n');

    const results = parseStreamOutput(output);
    expect(results).toHaveLength(2);
  });

  it('includes errors for invalid lines', () => {
    const output = [
      JSON.stringify({ type: 'message_start', message: { id: 'msg1', type: 'message', role: 'assistant', content: [], model: 'claude', stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } }),
      'invalid json here',
      JSON.stringify({ type: 'message_stop' }),
    ].join('\n');

    const results = parseStreamOutput(output);
    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });

  it('handles empty input', () => {
    const results = parseStreamOutput('');
    expect(results).toHaveLength(0);
  });

  it('handles whitespace-only input', () => {
    const results = parseStreamOutput('   \n\n   \n');
    expect(results).toHaveLength(0);
  });
});

describe('type guards for event types', () => {
  it('isSystemInitEvent correctly identifies system init events', () => {
    const systemInit: StreamEvent = { type: 'system', subtype: 'init', session_id: 'abc' };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isSystemInitEvent(systemInit)).toBe(true);
    expect(isSystemInitEvent(other)).toBe(false);
  });

  it('isAssistantMessageEvent correctly identifies assistant events', () => {
    const assistant: StreamEvent = {
      type: 'assistant',
      message: {
        id: 'msg1',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude',
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 5 },
      },
    };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isAssistantMessageEvent(assistant)).toBe(true);
    expect(isAssistantMessageEvent(other)).toBe(false);
  });

  it('isContentBlockDeltaEvent correctly identifies delta events', () => {
    const delta: StreamEvent = {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: 'Hi' },
    };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isContentBlockDeltaEvent(delta)).toBe(true);
    expect(isContentBlockDeltaEvent(other)).toBe(false);
  });

  it('isContentBlockStartEvent correctly identifies start events', () => {
    const start: StreamEvent = {
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'text', text: '' },
    };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isContentBlockStartEvent(start)).toBe(true);
    expect(isContentBlockStartEvent(other)).toBe(false);
  });

  it('isContentBlockStopEvent correctly identifies stop events', () => {
    const stop: StreamEvent = { type: 'content_block_stop', index: 0 };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isContentBlockStopEvent(stop)).toBe(true);
    expect(isContentBlockStopEvent(other)).toBe(false);
  });

  it('isToolUseEvent correctly identifies tool use events', () => {
    const toolUse: StreamEvent = {
      type: 'tool_use',
      tool: { id: 'tool1', name: 'Read', input: {} },
    };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isToolUseEvent(toolUse)).toBe(true);
    expect(isToolUseEvent(other)).toBe(false);
  });

  it('isToolResultEvent correctly identifies tool result events', () => {
    const toolResult: StreamEvent = {
      type: 'tool_result',
      tool_use_id: 'tool1',
      content: 'result',
    };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isToolResultEvent(toolResult)).toBe(true);
    expect(isToolResultEvent(other)).toBe(false);
  });

  it('isMessageStartEvent correctly identifies message start events', () => {
    const messageStart: StreamEvent = {
      type: 'message_start',
      message: {
        id: 'msg1',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude',
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 0 },
      },
    };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isMessageStartEvent(messageStart)).toBe(true);
    expect(isMessageStartEvent(other)).toBe(false);
  });

  it('isMessageDeltaEvent correctly identifies message delta events', () => {
    const messageDelta: StreamEvent = {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
      usage: { output_tokens: 50 },
    };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isMessageDeltaEvent(messageDelta)).toBe(true);
    expect(isMessageDeltaEvent(other)).toBe(false);
  });

  it('isMessageStopEvent correctly identifies message stop events', () => {
    const messageStop: StreamEvent = { type: 'message_stop' };
    const other: StreamEvent = { type: 'message_delta', delta: {}, usage: { output_tokens: 0 } };

    expect(isMessageStopEvent(messageStop)).toBe(true);
    expect(isMessageStopEvent(other)).toBe(false);
  });

  it('isResultSuccessEvent correctly identifies result success events', () => {
    const success: StreamEvent = { type: 'result', subtype: 'success', is_error: false };
    const error: StreamEvent = { type: 'result', subtype: 'error', error: 'oops', is_error: true };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isResultSuccessEvent(success)).toBe(true);
    expect(isResultSuccessEvent(error)).toBe(false);
    expect(isResultSuccessEvent(other)).toBe(false);
  });

  it('isResultErrorEvent correctly identifies result error events', () => {
    const error: StreamEvent = { type: 'result', subtype: 'error', error: 'oops', is_error: true };
    const success: StreamEvent = { type: 'result', subtype: 'success', is_error: false };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isResultErrorEvent(error)).toBe(true);
    expect(isResultErrorEvent(success)).toBe(false);
    expect(isResultErrorEvent(other)).toBe(false);
  });

  it('isUserMessageEvent correctly identifies user message events', () => {
    const userMessage: StreamEvent = {
      type: 'user',
      message: { role: 'user', content: 'Hello' },
    };
    const other: StreamEvent = { type: 'message_stop' };

    expect(isUserMessageEvent(userMessage)).toBe(true);
    expect(isUserMessageEvent(other)).toBe(false);
  });
});

describe('type guards for delta types', () => {
  it('isTextDelta correctly identifies text deltas', () => {
    const textDelta: ContentBlockDeltaEvent['delta'] = { type: 'text_delta', text: 'Hi' };
    const inputDelta: ContentBlockDeltaEvent['delta'] = { type: 'input_json_delta', partial_json: '{}' };
    const thinkingDelta: ContentBlockDeltaEvent['delta'] = { type: 'thinking_delta', thinking: 'hmm' };

    expect(isTextDelta(textDelta)).toBe(true);
    expect(isTextDelta(inputDelta)).toBe(false);
    expect(isTextDelta(thinkingDelta)).toBe(false);
  });

  it('isToolInputDelta correctly identifies tool input deltas', () => {
    const inputDelta: ContentBlockDeltaEvent['delta'] = { type: 'input_json_delta', partial_json: '{}' };
    const textDelta: ContentBlockDeltaEvent['delta'] = { type: 'text_delta', text: 'Hi' };
    const thinkingDelta: ContentBlockDeltaEvent['delta'] = { type: 'thinking_delta', thinking: 'hmm' };

    expect(isToolInputDelta(inputDelta)).toBe(true);
    expect(isToolInputDelta(textDelta)).toBe(false);
    expect(isToolInputDelta(thinkingDelta)).toBe(false);
  });

  it('isThinkingDelta correctly identifies thinking deltas', () => {
    const thinkingDelta: ContentBlockDeltaEvent['delta'] = { type: 'thinking_delta', thinking: 'hmm' };
    const textDelta: ContentBlockDeltaEvent['delta'] = { type: 'text_delta', text: 'Hi' };
    const inputDelta: ContentBlockDeltaEvent['delta'] = { type: 'input_json_delta', partial_json: '{}' };

    expect(isThinkingDelta(thinkingDelta)).toBe(true);
    expect(isThinkingDelta(textDelta)).toBe(false);
    expect(isThinkingDelta(inputDelta)).toBe(false);
  });
});

describe('type guards for content block types', () => {
  it('isTextBlock correctly identifies text blocks', () => {
    const textBlock: ContentBlock = { type: 'text', text: 'Hello' };
    const toolBlock: ContentBlock = { type: 'tool_use', id: 't1', name: 'Read', input: {} };
    const thinkingBlock: ContentBlock = { type: 'thinking', thinking: 'hmm' };

    expect(isTextBlock(textBlock)).toBe(true);
    expect(isTextBlock(toolBlock)).toBe(false);
    expect(isTextBlock(thinkingBlock)).toBe(false);
  });

  it('isToolUseBlock correctly identifies tool use blocks', () => {
    const toolBlock: ContentBlock = { type: 'tool_use', id: 't1', name: 'Read', input: {} };
    const textBlock: ContentBlock = { type: 'text', text: 'Hello' };
    const thinkingBlock: ContentBlock = { type: 'thinking', thinking: 'hmm' };

    expect(isToolUseBlock(toolBlock)).toBe(true);
    expect(isToolUseBlock(textBlock)).toBe(false);
    expect(isToolUseBlock(thinkingBlock)).toBe(false);
  });

  it('isThinkingBlockContent correctly identifies thinking blocks', () => {
    const thinkingBlock: ContentBlock = { type: 'thinking', thinking: 'hmm' };
    const textBlock: ContentBlock = { type: 'text', text: 'Hello' };
    const toolBlock: ContentBlock = { type: 'tool_use', id: 't1', name: 'Read', input: {} };

    expect(isThinkingBlockContent(thinkingBlock)).toBe(true);
    expect(isThinkingBlockContent(textBlock)).toBe(false);
    expect(isThinkingBlockContent(toolBlock)).toBe(false);
  });
});

describe('real-world CLI output simulation', () => {
  it('parses a complete streaming conversation', () => {
    const cliOutput = [
      // Session init
      '{"type":"system","subtype":"init","session_id":"sess-abc-123","cwd":"/home/user/project","model":"claude-3-opus"}',
      // User message echo
      '{"type":"user","message":{"role":"user","content":"Hello Claude!"},"session_id":"sess-abc-123"}',
      // Message start
      '{"type":"message_start","message":{"id":"msg_001","type":"message","role":"assistant","content":[],"model":"claude-3-opus","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":15,"output_tokens":0}}}',
      // Content block start
      '{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
      // Streaming tokens
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}',
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"!"}}',
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" How"}}',
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" can"}}',
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" I"}}',
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" help"}}',
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"?"}}',
      // Content block stop
      '{"type":"content_block_stop","index":0}',
      // Message delta with final usage
      '{"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":8}}',
      // Message stop
      '{"type":"message_stop"}',
      // Result
      '{"type":"result","subtype":"success","cost_usd":0.001,"duration_ms":1500,"is_error":false,"num_turns":1,"session_id":"sess-abc-123","total_cost_usd":0.001}',
    ].join('\n');

    const results = parseStreamOutput(cliOutput);

    expect(results).toHaveLength(15);
    expect(results.every(r => r.success)).toBe(true);

    // Verify event order
    const events = results.map(r => (r as { success: true; event: StreamEvent }).event);
    expect(isSystemInitEvent(events[0])).toBe(true);
    expect(isUserMessageEvent(events[1])).toBe(true);
    expect(isMessageStartEvent(events[2])).toBe(true);
    expect(isContentBlockStartEvent(events[3])).toBe(true);

    // Verify delta events
    for (let i = 4; i <= 10; i++) {
      expect(isContentBlockDeltaEvent(events[i])).toBe(true);
    }

    expect(isContentBlockStopEvent(events[11])).toBe(true);
    expect(isMessageDeltaEvent(events[12])).toBe(true);
    expect(isMessageStopEvent(events[13])).toBe(true);
    expect(isResultSuccessEvent(events[14])).toBe(true);
  });

  it('parses a tool use conversation', () => {
    const cliOutput = [
      '{"type":"system","subtype":"init","session_id":"sess-xyz","model":"claude-3-opus"}',
      '{"type":"message_start","message":{"id":"msg_001","type":"message","role":"assistant","content":[],"model":"claude-3-opus","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":100,"output_tokens":0}}}',
      '{"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
      '{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Let me read that file for you."}}',
      '{"type":"content_block_stop","index":0}',
      '{"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"tool_001","name":"Read","input":{}}}',
      '{"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\\"file_path\\": \\"/src/index.ts\\"}"}}',
      '{"type":"content_block_stop","index":1}',
      '{"type":"message_stop"}',
      '{"type":"tool_result","tool_use_id":"tool_001","content":"export const hello = \\"world\\";","is_error":false}',
    ].join('\n');

    const results = parseStreamOutput(cliOutput);
    expect(results).toHaveLength(10);
    expect(results.every(r => r.success)).toBe(true);

    const events = results.map(r => (r as { success: true; event: StreamEvent }).event);

    // Find tool-related events
    const toolUseStart = events.find(e => isContentBlockStartEvent(e) && e.content_block.type === 'tool_use');
    expect(toolUseStart).toBeDefined();

    const toolResult = events.find(e => isToolResultEvent(e));
    expect(toolResult).toBeDefined();
    if (toolResult && isToolResultEvent(toolResult)) {
      expect(toolResult.tool_use_id).toBe('tool_001');
      expect(toolResult.is_error).toBe(false);
    }
  });

  it('parses a thinking block conversation', () => {
    const cliOutput = [
      '{"type":"message_start","message":{"id":"msg_001","type":"message","role":"assistant","content":[],"model":"claude-3-opus","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":50,"output_tokens":0}}}',
      '{"type":"content_block_start","index":0,"content_block":{"type":"thinking","thinking":""}}',
      '{"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"Let me think about this problem..."}}',
      '{"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":" I need to consider the requirements."}}',
      '{"type":"content_block_stop","index":0}',
      '{"type":"content_block_start","index":1,"content_block":{"type":"text","text":""}}',
      '{"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"Here is my answer."}}',
      '{"type":"content_block_stop","index":1}',
      '{"type":"message_stop"}',
    ].join('\n');

    const results = parseStreamOutput(cliOutput);
    expect(results).toHaveLength(9);
    expect(results.every(r => r.success)).toBe(true);

    const events = results.map(r => (r as { success: true; event: StreamEvent }).event);

    // Find thinking block
    const thinkingStart = events.find(e => isContentBlockStartEvent(e) && e.content_block.type === 'thinking');
    expect(thinkingStart).toBeDefined();

    // Find thinking deltas
    const thinkingDeltas = events.filter(e =>
      isContentBlockDeltaEvent(e) && isThinkingDelta(e.delta)
    );
    expect(thinkingDeltas).toHaveLength(2);
  });
});
