// Date utility functions for grouping sessions by date

export type DateGroup =
  | 'today'
  | 'yesterday'
  | 'previous7days'
  | 'previous30days'
  | 'older';

export interface DateGroupInfo {
  key: DateGroup;
  label: string;
}

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  previous7days: 'Previous 7 Days',
  previous30days: 'Previous 30 Days',
  older: 'Older',
};

/**
 * Get the start of a day (midnight) for a given date
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the number of calendar days between two dates
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const start1 = startOfDay(date1);
  const start2 = startOfDay(date2);
  const diffTime = start2.getTime() - start1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine which date group a date belongs to relative to today
 */
export function getDateGroup(date: Date, now: Date = new Date()): DateGroup {
  const daysDiff = getDaysDifference(date, now);

  if (daysDiff === 0) {
    return 'today';
  } else if (daysDiff === 1) {
    return 'yesterday';
  } else if (daysDiff >= 2 && daysDiff <= 7) {
    return 'previous7days';
  } else if (daysDiff >= 8 && daysDiff <= 30) {
    return 'previous30days';
  } else {
    return 'older';
  }
}

/**
 * Get the display label for a date group
 */
export function getDateGroupLabel(group: DateGroup): string {
  return DATE_GROUP_LABELS[group];
}

/**
 * Get date group info (key and label)
 */
export function getDateGroupInfo(date: Date, now?: Date): DateGroupInfo {
  const key = getDateGroup(date, now);
  return {
    key,
    label: getDateGroupLabel(key),
  };
}

/**
 * Order for date groups (most recent first)
 */
export const DATE_GROUP_ORDER: DateGroup[] = [
  'today',
  'yesterday',
  'previous7days',
  'previous30days',
  'older',
];

/**
 * Compare function for sorting date groups
 */
export function compareDateGroups(a: DateGroup, b: DateGroup): number {
  return DATE_GROUP_ORDER.indexOf(a) - DATE_GROUP_ORDER.indexOf(b);
}

/**
 * Format a date for display in session item (e.g., "2:30 PM" for today, "Jan 15" for older)
 */
export function formatSessionDate(date: Date, now: Date = new Date()): string {
  const group = getDateGroup(date, now);

  if (group === 'today' || group === 'yesterday') {
    // Show time for recent sessions
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    // Show date for older sessions
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
}
