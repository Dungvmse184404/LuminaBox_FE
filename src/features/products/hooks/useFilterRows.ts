import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";

export type FilterRowKey = "shop" | "category" | "filling";

const HOVER_INTENT_MS = 180;

export function useFilterRows() {
  const [expanded, setExpanded] = useState<FilterRowKey | null>(null);
  const [pinned, setPinned] = useState<FilterRowKey | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const open = useCallback((key: FilterRowKey) => {
    setPinned((current) => (current === key ? current : null));
    setExpanded(key);
  }, []);

  const pin = useCallback((key: FilterRowKey) => {
    clearTimeout(hoverTimer.current);
    setPinned(key);
    setExpanded(key);
  }, []);

  const close = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setPinned(null);
    setExpanded(null);
  }, []);

  useEffect(() => {
    if (!pinned) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest?.(`[data-filter-row="${pinned}"]`)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pinned, close]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const rowProps = (key: FilterRowKey) => ({
    "data-filter-row": key,
    onMouseEnter: () => {
      clearTimeout(hoverTimer.current);
      if (pinned && pinned !== key) hoverTimer.current = setTimeout(() => open(key), HOVER_INTENT_MS);
      else open(key);
    },
    onMouseLeave: () => {
      clearTimeout(hoverTimer.current);
      if (!pinned && expanded === key) setExpanded(null);
    },
    onFocus: () => open(key),
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget;
      if (next && !event.currentTarget.contains(next)) close();
    },
  });

  const toggleHead = (key: FilterRowKey) => {
    if (pinned === key) close();
    else pin(key);
  };

  return { expanded, pinned, pin, close, rowProps, toggleHead };
}
