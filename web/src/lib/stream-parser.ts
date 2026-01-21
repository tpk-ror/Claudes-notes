// Parser for Claude CLI stream-json output events
// Based on PRD Section B - Stream Event Types

// Base event interface
export interface BaseStreamEvent {
  type: string;
}

// System initialization event
export interface SystemInitEvent extends BaseStreamEvent {
  type: 'system';
  subtype: 'init';
  session_id: string;
  cwd?: string;
  model?: string;
}

// Assistant message start event
export interface AssistantMessageEvent extends BaseStreamEvent {
  type: 'assistant';
  message: {
    id: string;
    type: 'message';
    role: 'assistant';
    content: ContentBlock[];
    model: string;
    stop_reason?: string | null;
    stop_sequence?: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  session_id?: string;
}

// Content block types
export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

// Content block delta event (streaming text)
export interface ContentBlockDeltaEvent extends BaseStreamEvent {
  type: 'content_block_delta';
  index: number;
  delta: TextDelta | ToolInputDelta | ThinkingDelta;
}

export interface TextDelta {
  type: 'text_delta';
  text: string;
}

export interface ToolInputDelta {
  type: 'input_json_delta';
  partial_json: string;
}

export interface ThinkingDelta {
  type: 'thinking_delta';
  thinking: string;
}

// Content block start event
export interface ContentBlockStartEvent extends BaseStreamEvent {
  type: 'content_block_start';
  index: number;
  content_block: ContentBlock;
}

// Content block stop event
export interface ContentBlockStopEvent extends BaseStreamEvent {
  type: 'content_block_stop';
  index: number;
}

// Tool use event
export interface ToolUseEvent extends BaseStreamEvent {
  type: 'tool_use';
  tool: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
}

// Tool result event
export interface ToolResultEvent extends BaseStreamEvent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

// Message start event
export interface MessageStartEvent extends BaseStreamEvent {
  type: 'message_start';
  message: {
    id: string;
    type: 'message';
    role: 'assistant';
    content: ContentBlock[];
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
}

// Message delta event (final usage stats)
export interface MessageDeltaEvent extends BaseStreamEvent {
  type: 'message_delta';
  delta: {
    stop_reason?: string;
    stop_sequence?: string | null;
  };
  usage?: {
    output_tokens: number;
  };
}

// Message stop event
export interface MessageStopEvent extends BaseStreamEvent {
  type: 'message_stop';
}

// Result success event (session ended)
export interface ResultSuccessEvent extends BaseStreamEvent {
  type: 'result';
  subtype: 'success';
  cost_usd?: number;
  duration_ms?: number;
  duration_api_ms?: number;
  is_error: false;
  num_turns?: number;
  result?: string;
  session_id?: string;
  total_cost_usd?: number;
}

// Result error event
export interface ResultErrorEvent extends BaseStreamEvent {
  type: 'result';
  subtype: 'error';
  error: string;
  is_error: true;
  session_id?: string;
}

// User message event
export interface UserMessageEvent extends BaseStreamEvent {
  type: 'user';
  message: {
    role: 'user';
    content: string | Array<{ type: 'text'; text: string }>;
  };
  session_id?: string;
}

// Union type of all stream events
export type StreamEvent =
  | SystemInitEvent
  | AssistantMessageEvent
  | ContentBlockDeltaEvent
  | ContentBlockStartEvent
  | ContentBlockStopEvent
  | ToolUseEvent
  | ToolResultEvent
  | MessageStartEvent
  | MessageDeltaEvent
  | MessageStopEvent
  | ResultSuccessEvent
  | ResultErrorEvent
  | UserMessageEvent;

// Parser result types
export interface ParseSuccess<T extends StreamEvent = StreamEvent> {
  success: true;
  event: T;
}

export interface ParseError {
  success: false;
  error: string;
  rawLine: string;
}

export type ParseResult<T extends StreamEvent = StreamEvent> = ParseSuccess<T> | ParseError;

/**
 * Parse a single line of stream-json output from the Claude CLI
 * @param line A single line of JSON output from stdout
 * @returns ParseResult with either the parsed event or an error
 */
export function parseStreamLine(line: string): ParseResult {
  const trimmedLine = line.trim();

  // Skip empty lines
  if (!trimmedLine) {
    return {
      success: false,
      error: 'Empty line',
      rawLine: line,
    };
  }

  try {
    const parsed = JSON.parse(trimmedLine);

    // Validate that we have a type field
    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: 'Parsed value is not an object',
        rawLine: line,
      };
    }

    if (!('type' in parsed) || typeof parsed.type !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid type field',
        rawLine: line,
      };
    }

    return {
      success: true,
      event: parsed as StreamEvent,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown parse error',
      rawLine: line,
    };
  }
}

/**
 * Parse multiple lines of stream-json output
 * @param text Multi-line string output from CLI stdout
 * @returns Array of ParseResults for each line
 */
export function parseStreamOutput(text: string): ParseResult[] {
  const lines = text.split('\n');
  return lines
    .map(line => parseStreamLine(line))
    .filter(result => !(result.success === false && result.error === 'Empty line'));
}

// Type guards for specific event types

export function isSystemInitEvent(event: StreamEvent): event is SystemInitEvent {
  return event.type === 'system' && (event as SystemInitEvent).subtype === 'init';
}

export function isAssistantMessageEvent(event: StreamEvent): event is AssistantMessageEvent {
  return event.type === 'assistant';
}

export function isContentBlockDeltaEvent(event: StreamEvent): event is ContentBlockDeltaEvent {
  return event.type === 'content_block_delta';
}

export function isContentBlockStartEvent(event: StreamEvent): event is ContentBlockStartEvent {
  return event.type === 'content_block_start';
}

export function isContentBlockStopEvent(event: StreamEvent): event is ContentBlockStopEvent {
  return event.type === 'content_block_stop';
}

export function isToolUseEvent(event: StreamEvent): event is ToolUseEvent {
  return event.type === 'tool_use';
}

export function isToolResultEvent(event: StreamEvent): event is ToolResultEvent {
  return event.type === 'tool_result';
}

export function isMessageStartEvent(event: StreamEvent): event is MessageStartEvent {
  return event.type === 'message_start';
}

export function isMessageDeltaEvent(event: StreamEvent): event is MessageDeltaEvent {
  return event.type === 'message_delta';
}

export function isMessageStopEvent(event: StreamEvent): event is MessageStopEvent {
  return event.type === 'message_stop';
}

export function isResultSuccessEvent(event: StreamEvent): event is ResultSuccessEvent {
  return event.type === 'result' && (event as ResultSuccessEvent).subtype === 'success';
}

export function isResultErrorEvent(event: StreamEvent): event is ResultErrorEvent {
  return event.type === 'result' && (event as ResultErrorEvent).subtype === 'error';
}

export function isUserMessageEvent(event: StreamEvent): event is UserMessageEvent {
  return event.type === 'user';
}

// Delta type guards

export function isTextDelta(delta: ContentBlockDeltaEvent['delta']): delta is TextDelta {
  return delta.type === 'text_delta';
}

export function isToolInputDelta(delta: ContentBlockDeltaEvent['delta']): delta is ToolInputDelta {
  return delta.type === 'input_json_delta';
}

export function isThinkingDelta(delta: ContentBlockDeltaEvent['delta']): delta is ThinkingDelta {
  return delta.type === 'thinking_delta';
}

// Content block type guards

export function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === 'text';
}

export function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return block.type === 'tool_use';
}

export function isThinkingBlockContent(block: ContentBlock): block is ThinkingBlock {
  return block.type === 'thinking';
}
