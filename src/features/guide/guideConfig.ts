export const GUIDE_CONFIG = {
  findTimeoutMs: 4000,
  checkDelayMs: 50,
  scrollDelayMs: 80,
  highlightMs: 10000,
  stepIdleTimeoutMs: 30000,
  ringInnerGapPx: 5,
  ringOuterGapPx: 13,
  ringOuterOpacity: 0.35,
  focusSpreadPx: 100,
  focusEnterMs: 560,
  focusOuterDelayMs: 80,
  focusExitMs: 200,
  pressMs: 300,
  pressDotPx: 8,
  pressSpreadPx: 11,
  pressScale: 0.96,
  longNameChars: 40,
} as const;

const WALK_MIN_WIDTH_VAR = "--lb-guide-walk-min-width";
const WALK_MIN_WIDTH_FALLBACK = "64rem";

export function walkMediaQuery(): string {
  const width = getComputedStyle(document.documentElement).getPropertyValue(WALK_MIN_WIDTH_VAR).trim();
  return `(min-width: ${width || WALK_MIN_WIDTH_FALLBACK})`;
}
