// Utility functions for plan file naming and parsing
// Naming convention: plan-{name}-{M.DD.YY}-{HHmm}.md

import type { ParsedPlanFileName } from '@/types/plan-files';

/**
 * Generate a plan filename from a name
 * Format: plan-{name}-{M.DD.YY}-{HHmm}.md
 *
 * @example
 * generatePlanFileName('Todo List') // "plan-todolist-1.20.26-0744.md"
 */
export function generatePlanFileName(name: string, date: Date = new Date()): string {
  const sanitized = sanitizePlanName(name);
  const dateStr = formatDateForFileName(date);
  const timeStr = formatTimeForFileName(date);

  return `plan-${sanitized}-${dateStr}-${timeStr}.md`;
}

/**
 * Parse a plan filename to extract name, date, and time
 *
 * @example
 * parsePlanFileName('plan-todolist-1.20.26-0744.md')
 * // { name: 'todolist', date: '1.20.26', time: '0744' }
 */
export function parsePlanFileName(fileName: string): ParsedPlanFileName | null {
  // Match pattern: plan-{name}-{M.DD.YY}-{HHmm}.md
  const match = fileName.match(/^plan-(.+)-(\d{1,2}\.\d{2}\.\d{2})-(\d{4})\.md$/);

  if (!match) {
    return null;
  }

  return {
    name: match[1],
    date: match[2],
    time: match[3],
  };
}

/**
 * Sanitize a plan name for use in filenames
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 * - Trims leading/trailing hyphens
 *
 * @example
 * sanitizePlanName('Todo List Feature!') // "todolist-feature"
 */
export function sanitizePlanName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
    // Limit length to reasonable size
    .slice(0, 50);
}

/**
 * Format date for filename (M.DD.YY format)
 *
 * @example
 * formatDateForFileName(new Date('2026-01-20')) // "1.20.26"
 */
export function formatDateForFileName(date: Date): string {
  const month = date.getMonth() + 1; // No leading zero
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  return `${month}.${day}.${year}`;
}

/**
 * Format time for filename (HHmm format, 24-hour)
 *
 * @example
 * formatTimeForFileName(new Date('2026-01-20T07:44:00')) // "0744"
 */
export function formatTimeForFileName(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}${minutes}`;
}

/**
 * Format a plan filename for display
 *
 * @example
 * formatPlanDisplayName('plan-todolist-1.20.26-0744.md')
 * // "Todolist (Jan 20, 7:44 AM)"
 */
export function formatPlanDisplayName(fileName: string): string {
  const parsed = parsePlanFileName(fileName);

  if (!parsed) {
    // Return filename without extension if parsing fails
    return fileName.replace(/\.md$/, '');
  }

  // Capitalize first letter of name
  const displayName = parsed.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Parse date and time
  const [month, day, year] = parsed.date.split('.').map(Number);
  const hours = parseInt(parsed.time.slice(0, 2), 10);
  const minutes = parsed.time.slice(2);

  // Format date string
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[month - 1] || month;

  // Format time (12-hour with AM/PM)
  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';

  return `${displayName} (${monthName} ${day}, ${hour12}:${minutes} ${ampm})`;
}

/**
 * Parse date from filename components
 */
export function parseDateFromFileName(parsed: ParsedPlanFileName): Date | null {
  try {
    const [month, day, year] = parsed.date.split('.').map(Number);
    const hours = parseInt(parsed.time.slice(0, 2), 10);
    const minutes = parseInt(parsed.time.slice(2), 10);

    // Assume 20xx century
    const fullYear = 2000 + year;

    return new Date(fullYear, month - 1, day, hours, minutes);
  } catch {
    return null;
  }
}

/**
 * Validate that a filename follows the plan naming convention
 */
export function isValidPlanFileName(fileName: string): boolean {
  return parsePlanFileName(fileName) !== null;
}

/**
 * Extract plan name from content (looks for first heading)
 */
export function extractPlanNameFromContent(content: string): string | null {
  // Look for first H1 or H2 heading
  const headingMatch = content.match(/^#+\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Look for first non-empty line
  const firstLine = content.split('\n').find(line => line.trim().length > 0);
  if (firstLine) {
    // Remove markdown formatting
    return firstLine.replace(/^#+\s*/, '').replace(/\*+/g, '').trim().slice(0, 50);
  }

  return null;
}
