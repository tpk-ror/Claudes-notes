// Parser for detecting questions with selectable options from agent output
// Detects numbered lists, lettered lists, and bullet points with bold labels

import type { ParsedQuestion, ParsedOption } from '@/types/plan-files';

/**
 * Parse agent output to detect questions with options
 *
 * Supported patterns:
 * 1. Numbered lists after question mark: "?\n1. Option A"
 * 2. Lettered lists: "?\na) Option A" or "?\na. Option A"
 * 3. Bullet points with bold labels: "- **Option A**: description"
 *
 * @example
 * const result = parseQuestionWithOptions(`Which approach do you prefer?
 * 1. Option A - Fast but less flexible
 * 2. Option B - More configurable
 * 3. Option C - Best of both worlds`);
 *
 * // Returns ParsedQuestion with 3 options
 */
export function parseQuestionWithOptions(text: string): ParsedQuestion | null {
  // Try each pattern in order of specificity
  return (
    parseNumberedList(text) ||
    parseLetteredList(text) ||
    parseBoldBulletList(text)
  );
}

/**
 * Check if text contains a parseable question with options
 */
export function hasSelectableOptions(text: string): boolean {
  return parseQuestionWithOptions(text) !== null;
}

/**
 * Parse numbered list format
 *
 * Pattern: Question?\n1. Option\n2. Option\n...
 */
function parseNumberedList(text: string): ParsedQuestion | null {
  // Find question ending with ? followed by numbered list
  const questionMatch = text.match(/([^\n]+\?)\s*\n/);
  if (!questionMatch) return null;

  const questionText = questionMatch[1].trim();
  const afterQuestion = text.slice(text.indexOf(questionMatch[0]) + questionMatch[0].length);

  // Match numbered items: "1. ", "2. ", etc.
  const itemPattern = /^\s*(\d+)\.\s+(.+?)(?=\n\s*\d+\.\s|\n\n|\n$|$)/gm;
  const options: ParsedOption[] = [];
  let match;

  while ((match = itemPattern.exec(afterQuestion)) !== null) {
    const index = parseInt(match[1], 10);
    const content = match[2].trim();

    // Extract label and value (split on " - " if present)
    const { label, value } = extractLabelValue(content);

    options.push({
      id: `option-${index}`,
      label,
      value,
      index,
    });
  }

  if (options.length < 2) return null;

  return {
    questionText,
    options,
    allowOther: true,
  };
}

/**
 * Parse lettered list format
 *
 * Pattern: Question?\na) Option\nb) Option\n... or a. Option\nb. Option
 */
function parseLetteredList(text: string): ParsedQuestion | null {
  const questionMatch = text.match(/([^\n]+\?)\s*\n/);
  if (!questionMatch) return null;

  const questionText = questionMatch[1].trim();
  const afterQuestion = text.slice(text.indexOf(questionMatch[0]) + questionMatch[0].length);

  // Match lettered items: "a) ", "b) ", "a. ", "b. ", etc.
  const itemPattern = /^\s*([a-z])[.)]\s+(.+?)(?=\n\s*[a-z][.)]\s|\n\n|\n$|$)/gim;
  const options: ParsedOption[] = [];
  let match;

  while ((match = itemPattern.exec(afterQuestion)) !== null) {
    const letter = match[1].toLowerCase();
    const index = letter.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
    const content = match[2].trim();

    const { label, value } = extractLabelValue(content);

    options.push({
      id: `option-${letter}`,
      label,
      value,
      index,
    });
  }

  if (options.length < 2) return null;

  return {
    questionText,
    options,
    allowOther: true,
  };
}

/**
 * Parse bullet list with bold labels
 *
 * Pattern: Question?\n- **Option**: description
 */
function parseBoldBulletList(text: string): ParsedQuestion | null {
  const questionMatch = text.match(/([^\n]+\?)\s*\n/);
  if (!questionMatch) return null;

  const questionText = questionMatch[1].trim();
  const afterQuestion = text.slice(text.indexOf(questionMatch[0]) + questionMatch[0].length);

  // Match bullet items with bold labels: "- **Label**: description" or "- **Label** - description"
  const itemPattern = /^\s*[-*]\s+\*\*([^*]+)\*\*[:\s-]+(.+?)(?=\n\s*[-*]\s+\*\*|\n\n|\n$|$)/gm;
  const options: ParsedOption[] = [];
  let match;
  let index = 1;

  while ((match = itemPattern.exec(afterQuestion)) !== null) {
    const label = match[1].trim();
    const description = match[2].trim();

    options.push({
      id: `option-${index}`,
      label,
      value: label, // Use label as value for bold bullet format
      index,
    });
    index++;
  }

  if (options.length < 2) return null;

  return {
    questionText,
    options,
    allowOther: true,
  };
}

/**
 * Extract label and value from option content
 * Handles formats like "Option A - description" or just "Option A"
 */
function extractLabelValue(content: string): { label: string; value: string } {
  // Check for " - " separator
  const separatorIndex = content.indexOf(' - ');
  if (separatorIndex > 0) {
    const label = content.slice(0, separatorIndex).trim();
    return { label, value: label };
  }

  // Check for ": " separator
  const colonIndex = content.indexOf(': ');
  if (colonIndex > 0) {
    const label = content.slice(0, colonIndex).trim();
    return { label, value: label };
  }

  // No separator, use entire content
  return { label: content, value: content };
}

/**
 * Get the text before the question (for context display)
 */
export function getTextBeforeQuestion(text: string): string | null {
  const questionMatch = text.match(/([^\n]+\?)\s*\n/);
  if (!questionMatch) return null;

  const beforeQuestion = text.slice(0, text.indexOf(questionMatch[0])).trim();
  return beforeQuestion || null;
}

/**
 * Get the text after the options (if any trailing content)
 */
export function getTextAfterOptions(text: string): string | null {
  const parsed = parseQuestionWithOptions(text);
  if (!parsed || parsed.options.length === 0) return null;

  // Find the last option's position
  const lastOption = parsed.options[parsed.options.length - 1];

  // This is a simplified approach - in practice, you may need more sophisticated parsing
  const lines = text.split('\n');
  let foundOptions = 0;
  let lastOptionLine = 0;

  for (let i = 0; i < lines.length; i++) {
    // Check if line looks like an option
    if (/^\s*(\d+[.)]|[a-z][.)]|[-*]\s+\*\*)/.test(lines[i])) {
      foundOptions++;
      lastOptionLine = i;
    }
  }

  if (lastOptionLine < lines.length - 1) {
    const afterText = lines.slice(lastOptionLine + 1).join('\n').trim();
    return afterText || null;
  }

  return null;
}
