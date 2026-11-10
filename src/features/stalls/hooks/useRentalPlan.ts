import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { clampDay, defaultMaster, fitSpan, MIN_RENTAL_DAYS, moonNum, parseShort, seasonSpan, seasonYears, spanDays, type DayRange, type Span } from "../timeline";

const MIN_GAP = MIN_RENTAL_DAYS - 1;

export interface PlanItem extends DayRange {
  id: string;
}

export interface PlanSnapshot {
  year: number;
  items: PlanItem[];
}

interface PlanState {
  year: number;
  span: Span;
  items: PlanItem[];
  spanText: { from?: string; to?: string };
  editing: string | null;
  cursor: { day: number; edge: number } | null;
  open: boolean;
}

interface Drag {
  id: string;
  mode: "start" | "end" | "move";
  x: number;
  width: number;
  start: number;
  end: number;
}

const shiftItems = (items: PlanItem[], fromYear: number, toYear: number) => {
  const shift = moonNum(toYear) - moonNum(fromYear);
  return items.map(({ id, start, end }) => ({ id, start: start + shift, end: end + shift }));
};

function initialState(years: number[], snapshot?: PlanSnapshot | null): PlanState {
  const saved = snapshot?.year;
  const year = saved !== undefined && years.includes(saved) ? saved : years[0];
  const items = shiftItems(snapshot?.items ?? [], saved ?? year, year);
  return { year, span: fitSpan(seasonSpan(year), items), items, spanText: {}, editing: null, cursor: null, open: true };
}

export function useRentalPlan(snapshot?: PlanSnapshot | null) {
  const [years] = useState(seasonYears);
  const [state, setState] = useState<PlanState>(() => initialState(years, snapshot));

  const stateRef = useRef(state);
  stateRef.current = state;
  const dragRef = useRef<Drag | null>(null);

  const patch = useCallback((next: Partial<PlanState>) => setState((current) => ({ ...current, ...next })), []);

  const viewSpan = useMemo<Span>(() => {
    const { span, spanText, year, items } = state;
    const from = parseShort(spanText.from, year);
    const to = parseShort(spanText.to, year);
    if (from === null && to === null) return span;
    return {
      from: from === null ? span.from : Math.min(from, ...items.map((item) => item.start)),
      to: to === null ? span.to : Math.max(to, ...items.map((item) => item.end)),
    };
  }, [state]);

  const viewRef = useRef(viewSpan);
  viewRef.current = viewSpan;

  const rangeById = useCallback((id: string): DayRange => {
    const item = stateRef.current.items.find((i) => i.id === id);
    return item ?? defaultMaster(stateRef.current.year);
  }, []);

  const setRange = useCallback((id: string, start: number, end: number) => {
    setState((current) => ({ ...current, items: current.items.map((item) => (item.id === id ? { id, start, end } : item)) }));
  }, []);

  const onWindowMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const span = viewRef.current;
      const delta = Math.round(((e.clientX - drag.x) / drag.width) * spanDays(span));
      if (drag.mode === "start") {
        const start = clampDay(drag.start + delta, span.from, drag.end - MIN_GAP);
        setRange(drag.id, start, drag.end);
        patch({ cursor: { day: start, edge: start } });
      } else if (drag.mode === "end") {
        const end = clampDay(drag.end + delta, drag.start + MIN_GAP, span.to);
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
    (id: string, mode: Drag["mode"], e: ReactPointerEvent<HTMLElement>, range: DayRange) => {
      e.stopPropagation();
      const track = e.currentTarget.closest(".track");
      if (!track) return;
      dragRef.current = { id, mode, x: e.clientX, width: track.getBoundingClientRect().width, start: range.start, end: range.end };
      patch({ editing: id });
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
    (id: string, which: "start" | "end", e: KeyboardEvent) => {
      const delta = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
      if (delta === 0) return;
      e.preventDefault();
      const span = viewRef.current;
      const range = rangeById(id);
      if (which === "start") {
        const start = clampDay(range.start + delta, span.from, range.end - MIN_GAP);
        setRange(id, start, range.end);
        patch({ cursor: { day: start, edge: start } });
      } else {
        const end = clampDay(range.end + delta, range.start + MIN_GAP, span.to);
        setRange(id, range.start, end);
        patch({ cursor: { day: end, edge: end + 1 } });
      }
    },
    [patch, rangeById, setRange],
  );

  const toggle = useCallback((id: string, preferred?: DayRange) => {
    setState((current) => {
      if (current.items.some((item) => item.id === id)) {
        return { ...current, items: current.items.filter((item) => item.id !== id), cursor: null };
      }
      const range = preferred ?? defaultMaster(current.year);
      return { ...current, items: [...current.items, { id, start: range.start, end: range.end }], open: true };
    });
  }, []);

  const setYear = useCallback((year: number) => {
    setState((current) => {
      const items = shiftItems(current.items, current.year, year);
      return { ...current, year, cursor: null, spanText: {}, items, span: fitSpan(seasonSpan(year), items) };
    });
  }, []);

  const resetTimeline = useCallback(() => {
    setState((current) => {
      const span = seasonSpan(current.year);
      const clamp = (value: number) => clampDay(value, span.from, span.to);
      return {
        ...current,
        span,
        spanText: {},
        cursor: null,
        items: current.items.map((item) => ({ ...item, start: clamp(item.start), end: clamp(item.end) })),
      };
    });
  }, []);

  const linkAll = useCallback(() => {
    setState((current) => {
      const [first] = current.items;
      if (!first) return current;
      return { ...current, items: current.items.map((item) => ({ ...item, start: first.start, end: first.end })) };
    });
  }, []);

  const applySpanText = useCallback(() => patch({ span: viewRef.current, spanText: {} }), [patch]);

  return {
    state,
    years,
    viewSpan,
    patch,
    setRange,
    startDrag,
    onTrackDown,
    onAxisMove,
    onAxisLeave,
    nudge,
    toggle,
    setYear,
    resetTimeline,
    linkAll,
    applySpanText,
  };
}

export type RentalPlan = ReturnType<typeof useRentalPlan>;
