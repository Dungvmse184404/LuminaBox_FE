export const GUIDE_CONFIG = {
  findTimeoutMs: 4000,
  checkDelayMs: 50,
  scrollDelayMs: 80,
  highlightMs: 10000,
  stepIdleTimeoutMs: 30000,
  ringGapPx: 4,
  badgeEdgePx: 16,
  longNameChars: 40,
} as const;

const WALK_MIN_WIDTH_VAR = "--lb-guide-walk-min-width";
const WALK_MIN_WIDTH_FALLBACK = "64rem";

export function walkMediaQuery(): string {
  const width = getComputedStyle(document.documentElement).getPropertyValue(WALK_MIN_WIDTH_VAR).trim();
  return `(min-width: ${width || WALK_MIN_WIDTH_FALLBACK})`;
}
