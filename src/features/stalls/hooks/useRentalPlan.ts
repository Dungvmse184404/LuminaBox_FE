import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { clampDay, defaultMaster, fitSpan, moonNum, parseShort, seasonSpan, spanDays, type DayRange, type Span } from "../timeline";

export interface PlanItem {
  id: string;
  custom: boolean;
  start?: number;
  end?: number;
}

interface PlanState {
  year: number;
  span: Span;
  master: DayRange;
  items: PlanItem[];
  spanText: { from?: string; to?: string };
  editing: string | null;
  cursor: { day: number; edge: number } | null;
  confirming: boolean;
  sent: boolean;
  open: boolean;
}

interface Drag {
  id: string | null;
  mode: "start" | "end" | "move";
  x: number;
  width: number;
  start: number;
  end: number;
}

const FIRST_YEAR = 2027;
const FRESH = { confirming: false, sent: false };

export function useRentalPlan() {
  const [state, setState] = useState<PlanState>({
    year: FIRST_YEAR,
    span: seasonSpan(FIRST_YEAR),
    master: defaultMaster(FIRST_YEAR),
    items: [],
    spanText: {},
    editing: null,
    cursor: null,
    confirming: false,
    sent: false,
    open: true,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const dragRef = useRef<Drag | null>(null);

  const patch = useCallback((next: Partial<PlanState>) => setState((current) => ({ ...current, ...next })), []);

  const viewSpan = useMemo<Span>(() => {
    const { span, spanText, year, items, master } = state;
    const from = parseShort(spanText.from, year);
    const to = parseShort(spanText.to, year);
    if (from === null && to === null) return span;
    const ranges = [master, ...items.filter((item) => item.custom).map((item) => item as DayRange)];
    return {
      from: from === null ? span.from : Math.min(from, ...ranges.map((r) => r.start)),
      to: to === null ? span.to : Math.max(to, ...ranges.map((r) => r.end)),
    };
  }, [state]);

  const viewRef = useRef(viewSpan);
  viewRef.current = viewSpan;

  const rangeOf = useCallback(
    (item: PlanItem): DayRange => (item.custom ? { start: item.start!, end: item.end! } : stateRef.current.master),
    [],
  );

  const rangeById = useCallback(
    (id: string | null) => {
      const item = id === null ? undefined : stateRef.current.items.find((i) => i.id === id);
      return item ? rangeOf(item) : stateRef.current.master;
    },
    [rangeOf],
  );

  const setRange = useCallback((id: string | null, start: number, end: number) => {
    setState((current) => {
      if (id === null) return { ...current, ...FRESH, master: { start, end } };
      const custom = start !== current.master.start || end !== current.master.end;
      return { ...current, ...FRESH, items: current.items.map((item) => (item.id === id ? { id, custom, start, end } : item)) };
    });
  }, []);

  const onWindowMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const span = viewRef.current;
      const delta = Math.round(((e.clientX - drag.x) / drag.width) * spanDays(span));
      if (drag.mode === "start") {
        const start = clampDay(drag.start + delta, span.from, drag.end);
        setRange(drag.id, start, drag.end);
        patch({ cursor: { day: start, edge: start } });
      } else if (drag.mode === "end") {
        const end = clampDay(drag.end + delta, drag.start, span.to);
        setRange(drag.id, drag.start, end);
        patch({ cursor: { day: end, edge: end + 1 } });
      } else {
        const length = drag.end - drag.start;
        const start = clampDay(drag.start + delta, span.from, span.to - length);
        setRange(drag.id, start, start + length);
        patch({ cursor: { day: start, edge: start } });
      }
    },
    [patch, setRange],
  );

  const onWindowUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onWindowMove);
    window.removeEventListener("pointerup", onWindowUp);
    patch({ cursor: null, editing: null });
  }, [onWindowMove, patch]);

  useEffect(
    () => () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
    },
    [onWindowMove, onWindowUp],
  );

  const startDrag = useCallback(
    (id: string | null, mode: Drag["mode"], e: ReactPointerEvent<HTMLElement>, range: DayRange) => {
      e.stopPropagation();
      const track = e.currentTarget.closest(".track, .axis");
      if (!track) return;
      dragRef.current = { id, mode, x: e.clientX, width: track.getBoundingClientRect().width, start: range.start, end: range.end };
      patch({ editing: id ?? "master" });
      window.addEventListener("pointermove", onWindowMove);
      window.addEventListener("pointerup", onWindowUp);
    },
    [onWindowMove, onWindowUp, patch],
  );

  const dayFromEvent = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const span = viewRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    return clampDay(span.from + Math.round(((e.clientX - rect.left) / rect.width) * spanDays(span)), span.from, span.to);
  }, []);

  const onTrackDown = useCallback(
    (id: string, e: ReactPointerEvent<HTMLElement>) => {
      const span = viewRef.current;
      const range = rangeById(id);
      const length = range.end - range.start;
      const start = clampDay(dayFromEvent(e) - Math.floor(length / 2), span.from, span.to - length);
      setRange(id, start, start + length);
      startDrag(id, "move", e, { start, end: start + length });
    },
    [dayFromEvent, rangeById, setRange, startDrag],
  );

  const onAxisMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (dragRef.current) return;
      const day = dayFromEvent(e);
      patch({ cursor: { day, edge: day } });
    },
    [dayFromEvent, patch],
  );

  const onAxisLeave = useCallback(() => {
    if (!dragRef.current) patch({ cursor: null });
  }, [patch]);

  const nudge = useCallback(
    (id: string | null, which: "start" | "end", e: KeyboardEvent) => {
      const delta = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
      if (delta === 0) return;
      e.preventDefault();
      const span = viewRef.current;
      const range = rangeById(id);
      if (which === "start") {
        const start = clampDay(range.start + delta, span.from, range.end);
        setRange(id, start, range.end);
        patch({ cursor: { day: start, edge: start } });
      } else {
        const end = clampDay(range.end + delta, range.start, span.to);
        setRange(id, range.start, end);
        patch({ cursor: { day: end, edge: end + 1 } });
      }
    },
    [patch, rangeById, setRange],
  );

  const toggle = useCallback((id: string) => {
    setState((current) => {
      const has = current.items.some((item) => item.id === id);
      return has
        ? { ...current, ...FRESH, items: current.items.filter((item) => item.id !== id), cursor: null }
        : { ...current, ...FRESH, items: [...current.items, { id, custom: false }], open: true };
    });
  }, []);

  const relink = useCallback((id: string) => {
    setState((current) => ({ ...current, ...FRESH, items: current.items.map((item) => (item.id === id ? { id, custom: false } : item)) }));
  }, []);

  const setYear = useCallback((year: number) => {
    setState((current) => {
      const shift = moonNum(year) - moonNum(current.year);
      const master = { start: current.master.start + shift, end: current.master.end + shift };
      const items = current.items.map((item) => (item.custom ? { ...item, start: item.start! + shift, end: item.end! + shift } : item));
      const customs = items.filter((item) => item.custom).map((item) => item as DayRange);
      return { ...current, ...FRESH, year, cursor: null, spanText: {}, master, items, span: fitSpan(seasonSpan(year), [master, ...customs]) };
    });
  }, []);

  const resetTimeline = useCallback(() => {
    setState((current) => {
      const span = seasonSpan(current.year);
      const clamp = (value: number) => clampDay(value, span.from, span.to);
      return {
        ...current,
        ...FRESH,
        span,
        spanText: {},
        cursor: null,
        master: defaultMaster(current.year),
        items: current.items.map((item) => (item.custom ? { ...item, start: clamp(item.start!), end: clamp(item.end!) } : item)),
      };
    });
  }, []);

  const resetStalls = useCallback(() => {
    setState((current) => ({ ...current, ...FRESH, items: current.items.map((item) => ({ id: item.id, custom: false })) }));
  }, []);

  const applySpanText = useCallback(() => patch({ span: viewRef.current, spanText: {} }), [patch]);

  return {
    state,
    viewSpan,
    patch,
    rangeOf,
    setRange,
    startDrag,
    onTrackDown,
    onAxisMove,
    onAxisLeave,
    nudge,
    toggle,
    relink,
    setYear,
    resetTimeline,
    resetStalls,
    applySpanText,
  };
}

export type RentalPlan = ReturnType<typeof useRentalPlan>;
