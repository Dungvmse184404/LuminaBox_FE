import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/cn";

interface Props {
  scopeRef: RefObject<HTMLElement | null>;
  activeSelector?: string;
  itemSelector?: string;
  spread?: number;
  className?: string;
}

interface GlowSpot {
  x: number;
  width: number;
  idle: boolean;
}

const DEFAULT_ACTIVE_SELECTOR = '[aria-current="page"], [aria-selected="true"]';
const IDLE_WIDTH_RATIO = 0.4;
const WATCHED_ATTRIBUTES = ["aria-current", "aria-selected", "class"];
const PENDING_HOLD_MS = 3000;

export function GlowHairline({ scopeRef, activeSelector = DEFAULT_ACTIVE_SELECTOR, itemSelector, spread = 2, className }: Props) {
  const lineRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef<HTMLElement | null>(null);
  const pendingRef = useRef<HTMLElement | null>(null);
  const [spot, setSpot] = useState<GlowSpot | null>(null);
  const [animated, setAnimated] = useState(false);

  const measure = useCallback(() => {
    const line = lineRef.current;
    const scope = scopeRef.current;
    if (!line) return;
    const lineRect = line.getBoundingClientRect();
    const active = scope?.querySelector<HTMLElement>(activeSelector) ?? null;
    if (pendingRef.current && (pendingRef.current === active || !pendingRef.current.isConnected)) pendingRef.current = null;
    const target = hoveredRef.current ?? pendingRef.current ?? active;
    const targetRect = target?.getBoundingClientRect();
    const next: GlowSpot =
      targetRect && targetRect.width > 0
        ? { x: targetRect.left + targetRect.width / 2 - lineRect.left, width: targetRect.width * spread, idle: false }
        : { x: lineRect.width / 2, width: lineRect.width * IDLE_WIDTH_RATIO, idle: true };
    setSpot((current) =>
      current && current.idle === next.idle && Math.abs(current.x - next.x) < 0.5 && Math.abs(current.width - next.width) < 0.5 ? current : next,
    );
  }, [scopeRef, activeSelector, spread]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    if (!spot || animated) return;
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [spot, animated]);

  useEffect(() => {
    const scope = scopeRef.current;
    const line = lineRef.current;
    if (!scope || !line) return;
    let disposed = false;
    let pendingTimer: number | undefined;

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(scope);
    resizeObserver.observe(line);

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(scope, { subtree: true, childList: true, attributes: true, attributeFilter: WATCHED_ATTRIBUTES });

    const followItem = (event: Event) => {
      if (!itemSelector || !(event.target instanceof Element)) return;
      const item = event.target.closest<HTMLElement>(itemSelector);
      if (!item || !scope.contains(item) || item === hoveredRef.current) return;
      hoveredRef.current = item;
      measure();
    };
    const releaseItem = (event: Event) => {
      const next = event instanceof FocusEvent ? event.relatedTarget : null;
      if (next instanceof Node && scope.contains(next)) return;
      if (event.type === "focusout" && scope.matches(":hover")) return;
      hoveredRef.current = null;
      measure();
    };
    const holdItem = (event: Event) => {
      if (!itemSelector || !(event.target instanceof Element)) return;
      const item = event.target.closest<HTMLElement>(itemSelector);
      if (!item || !scope.contains(item)) return;
      pendingRef.current = item;
      window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(() => {
        pendingRef.current = null;
        measure();
      }, PENDING_HOLD_MS);
      measure();
    };

    scope.addEventListener("click", holdItem);
    scope.addEventListener("pointerover", followItem);
    scope.addEventListener("focusin", followItem);
    scope.addEventListener("pointerleave", releaseItem);
    scope.addEventListener("focusout", releaseItem);
    window.addEventListener("resize", measure);
    document.fonts.addEventListener("loadingdone", measure);
    document.fonts.ready.then(() => {
      if (!disposed) measure();
    });

    return () => {
      disposed = true;
      window.clearTimeout(pendingTimer);
      resizeObserver.disconnect();
      scope.removeEventListener("click", holdItem);
      mutationObserver.disconnect();
      scope.removeEventListener("pointerover", followItem);
      scope.removeEventListener("focusin", followItem);
      scope.removeEventListener("pointerleave", releaseItem);
      scope.removeEventListener("focusout", releaseItem);
      window.removeEventListener("resize", measure);
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [scopeRef, itemSelector, measure]);

  return (
    <div
      ref={lineRef}
      aria-hidden
      className={cn("lb-glow-hairline", className)}
      data-animated={animated || undefined}
      data-idle={spot?.idle || undefined}
    >
      {spot && <span className="lb-glow-hairline-spot" style={{ width: spot.width, transform: `translateX(${spot.x - spot.width / 2}px)` }} />}
    </div>
  );
}
