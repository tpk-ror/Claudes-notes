// Detector for identifying plan content vs regular chat content
// Used to route streamed content to the appropriate destination

export interface PlanDetectionResult {
  /** Whether the content appears to be plan content */
  isPlanContent: boolean;
  /** Extracted plan title (if detected) */
  planTitle: string | null;
  /** Confidence level (0-1) of the detection */
  confidence: number;
  /** The position where plan content starts (-1 if not found) */
  planStartIndex: number;
}

/**
 * Plan content markers and patterns
 */
const PLAN_MARKERS = [
  /^#+\s*(Plan|Implementation Plan|Feature Plan|Project Plan)/im,
  /^#+\s*(Overview|Summary|Approach)/im,
  /^#+\s*(Phase \d+|Step \d+|Task \d+)/im,
  /^#+\s*(Implementation|Architecture|Design)/im,
];

const PLAN_INTRO_PATTERNS = [
  /here'?s?\s+(the|a|my)\s+plan/i,
  /i'?ll\s+outline\s+(the|a)\s+plan/i,
  /let\s+me\s+(create|draft|outline)\s+(a|the)\s+plan/i,
  /here'?s?\s+an?\s+(implementation|feature|detailed)\s+plan/i,
  /the\s+following\s+plan/i,
  /proposed\s+plan/i,
];

const PLAN_STRUCTURE_PATTERNS = [
  /^##\s+.*\n+.*\n+###\s+/m, // Has H2 followed by H3 (structured)
  /^##\s+Phase\s+\d/m, // "Phase 1", "Phase 2" headers
  /^##\s+Task\s+\d/m, // "Task 1", "Task 2" headers
  /^##\s+Step\s+\d/m, // "Step 1", "Step 2" headers
  /^-\s+\[[ x]\]/m, // Task checkboxes
];

/**
 * Detect if content is plan content vs regular chat
 *
 * @param content - The content to analyze
 * @returns Detection result with confidence score
 */
export function detectPlanContent(content: string): PlanDetectionResult {
  if (!content || content.trim().length < 50) {
    return {
      isPlanContent: false,
      planTitle: null,
      confidence: 0,
      planStartIndex: -1,
    };
  }

  let confidence = 0;
  let planStartIndex = -1;
  let planTitle: string | null = null;

  // Check for plan markers in headings
  for (const pattern of PLAN_MARKERS) {
    const match = content.match(pattern);
    if (match) {
      confidence += 0.3;
      if (planStartIndex === -1 || match.index! < planStartIndex) {
        planStartIndex = match.index!;
      }
      // Extract title from heading
      if (!planTitle) {
        const titleMatch = match[0].match(/^#+\s*(.+)$/m);
        if (titleMatch) {
          planTitle = titleMatch[1].trim();
        }
      }
    }
  }

  // Check for intro patterns
  for (const pattern of PLAN_INTRO_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      confidence += 0.2;
      if (planStartIndex === -1 || match.index! < planStartIndex) {
        planStartIndex = match.index!;
      }
      break; // Only count intro once
    }
  }

  // Check for structured content patterns
  for (const pattern of PLAN_STRUCTURE_PATTERNS) {
    if (pattern.test(content)) {
      confidence += 0.15;
    }
  }

  // Check for multiple markdown headings (indicates structured document)
  const headingCount = (content.match(/^#+\s+/gm) || []).length;
  if (headingCount >= 3) {
    confidence += 0.1;
  }
  if (headingCount >= 5) {
    confidence += 0.1;
  }

  // Check for bullet lists with tasks
  const bulletCount = (content.match(/^[-*]\s+/gm) || []).length;
  if (bulletCount >= 3) {
    confidence += 0.05;
  }

  // Check for numbered lists
  const numberedCount = (content.match(/^\d+\.\s+/gm) || []).length;
  if (numberedCount >= 3) {
    confidence += 0.05;
  }

  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0);

  // Threshold for considering it plan content
  const isPlanContent = confidence >= 0.35;

  // If no title found but it's plan content, try to extract from first heading
  if (isPlanContent && !planTitle) {
    const firstHeading = content.match(/^#+\s+(.+)$/m);
    if (firstHeading) {
      planTitle = firstHeading[1].trim();
    }
  }

  return {
    isPlanContent,
    planTitle,
    confidence,
    planStartIndex: isPlanContent ? Math.max(0, planStartIndex) : -1,
  };
}

/**
 * Check if content starts with a plan-like structure
 * Used for early detection during streaming
 */
export function hasEarlyPlanIndicators(content: string): boolean {
  if (content.length < 20) return false;

  // Check first 500 chars for early indicators
  const prefix = content.slice(0, 500);

  // Check for intro patterns
  for (const pattern of PLAN_INTRO_PATTERNS) {
    if (pattern.test(prefix)) {
      return true;
    }
  }

  // Check for plan marker in heading
  for (const pattern of PLAN_MARKERS) {
    if (pattern.test(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract plan title from content
 */
export function extractPlanTitle(content: string): string | null {
  // First try plan-specific headings
  for (const pattern of PLAN_MARKERS) {
    const match = content.match(pattern);
    if (match) {
      const titleMatch = match[0].match(/^#+\s*(.+)$/m);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }
  }

  // Fall back to first heading
  const firstHeading = content.match(/^#+\s+(.+)$/m);
  if (firstHeading) {
    return firstHeading[1].trim();
  }

  // Fall back to first non-empty line
  const firstLine = content.trim().split('\n')[0];
  if (firstLine && firstLine.length <= 100) {
    return firstLine.replace(/^#+\s*/, '').replace(/\*+/g, '').trim() || null;
  }

  return null;
}

/**
 * Determine minimum content length before attempting detection
 * (avoids false positives on short content)
 */
export function getMinDetectionLength(): number {
  return 100;
}
