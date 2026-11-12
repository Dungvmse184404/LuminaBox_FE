import { useMemo } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Link2, RotateCcw, X } from "lucide-react";
import type { RentalPlan } from "../hooks/useRentalPlan";
import {
  buildExts,
  buildLines,
  buildMarks,
  bookedRanges,
  buildTicks,
  clashes,
  compactPrice,
  cursorLabel,
  edgePct,
  fullDate,
  ICONS,
  moonsIn,
  moonSummary,
  priceText,
  rentalDays,
  shortDate,
  vnToday,
  widthPct,
  type DayRange,
  type Ext,
  type Line,
  type Mark,
} from "../timeline";
import type { Stall } from "../types";

interface Props {
  plan: RentalPlan;
  stalls: Stall[];
  hoverId: string | null;
  submitLabel: string;
  lockedIds?: Set<string>;
  onBack?: () => void;
  onHover: (id: string | null) => void;
  onFocus: (id: string) => void;
  onSubmit: () => void;
}

function Icon({ path, size }: { path: string; size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const shortName = (name: string) => name.replace(/^Gian\s+/i, "");

interface Issue {
  label: string;
  title: string;
}

const ISSUES = {
  clash: { label: "Trùng lịch", title: "trùng lịch đã có người thuê" },
  past: { label: "Ngày đã qua", title: "ngày bắt đầu đã qua" },
  pending: { label: "Đang chờ duyệt", title: "bạn đã có đơn thuê gian này đang chờ duyệt" },
} satisfies Record<string, Issue>;
const EDGE_CLEAR = 7;

function TrackLines({ lines, soft, halos, exts }: { lines: Line[]; soft?: boolean; halos: number[]; exts: Ext[] }) {
  return (
    <>
      {exts.map((ext) => (
        <span key={ext.left} className="tl-ext" style={{ left: `${ext.left}%`, width: `${ext.width}%` }} />
      ))}
      {halos.map((pct) => (
        <span key={pct} className={soft ? "halo halo-soft" : "halo"} style={{ left: `${pct}%` }} />
      ))}
      {lines.map((line) => (
        <span key={line.pct} className={line.month ? "tl-line tl-line-month" : "tl-line"} style={{ left: `${line.pct}%` }} />
      ))}
    </>
  );
}

interface RowProps {
  plan: RentalPlan;
  stall: Stall;
  range: DayRange;
  booked: DayRange[];
  issue: Issue | null;
  isOn: boolean;
  lines: Line[];
  marks: Mark[];
  halos: number[];
  exts: Ext[];
  onHover: (id: string | null) => void;
  onFocus: (id: string) => void;
}

function StallRow({ plan, stall, range, booked, issue, isOn, lines, marks, halos, exts, onHover, onFocus }: RowProps) {
  const span = plan.viewSpan;
  const days = rentalDays(range);
  const cost = stall.rentalPrice * days;
  const moon = moonSummary(range);
  const { cursor } = plan.state;

  return (
    <div className="tl-grid tl-row" onMouseEnter={() => onHover(stall.id)} onMouseLeave={() => onHover(null)}>
      <div className="tl-name">
        <button type="button" className="tl-link" title={issue ? `${stall.name}: ${issue.title}` : stall.name} onClick={() => onFocus(stall.id)}>
          {shortName(stall.name)}
          {issue && <span className="tl-clash">{issue.label}</span>}
        </button>
        <button type="button" className="tl-remove" aria-label={`Bỏ ${stall.name} khỏi lịch thuê`} onClick={() => plan.toggle(stall.id)}>
          <X size={13} />
        </button>
      </div>
      <div className="track" onPointerDown={(e) => plan.onTrackDown(stall.id, e)} onPointerMove={plan.onAxisMove} onPointerLeave={plan.onAxisLeave}>
        <div className="track-in">
          <TrackLines lines={lines} halos={halos} exts={exts} soft />
          {booked
            .filter((b) => b.end >= span.from && b.start <= span.to)
            .map((b) => {
              const start = Math.max(b.start, span.from);
              const end = Math.min(b.end, span.to);
              return (
                <span
                  key={b.start}
                  className="tl-booked"
                  title={`Đã có người thuê ${fullDate(b.start)} – ${b.end > span.to + 365 ? "chưa hẹn ngày" : fullDate(b.end)}`}
                  style={{ left: `${edgePct(span, start)}%`, width: `${widthPct(span, end - start + 1)}%` }}
                />
              );
            })}
        </div>
        <div
          className={`bar${isOn ? " bar-on" : ""}${issue ? " bar-clash" : ""}`}
          style={{ left: `${edgePct(span, range.start)}%`, width: `${widthPct(span, days)}%` }}
          onPointerDown={(e) => plan.startDrag(stall.id, "move", e, range)}
        >
          <div className="bar-fill" title={`${fullDate(range.start)} – ${fullDate(range.end)}`} />
          <span className="bar-days">{days}d</span>
          <span className="bar-edge bar-edge-l">{shortDate(range.start)}</span>
          <span className="bar-edge bar-edge-r">{shortDate(range.end)}</span>
          <button
            type="button"
            className="handle handle-l"
            aria-label={`Ngày bắt đầu thuê ${stall.name}`}
            onPointerDown={(e) => plan.startDrag(stall.id, "start", e, range)}
            onKeyDown={(e) => plan.nudge(stall.id, "start", e)}
          />
          <button
            type="button"
            className="handle handle-r"
            aria-label={`Ngày kết thúc thuê ${stall.name}`}
            onPointerDown={(e) => plan.startDrag(stall.id, "end", e, range)}
            onKeyDown={(e) => plan.nudge(stall.id, "end", e)}
          />
        </div>
        <div className="track-over">
          {marks.map((mark) => (
            <span key={mark.name} className={mark.moon ? "tl-mark-line tl-mark-moon" : "tl-mark-line"} style={{ left: `${mark.pct}%` }} />
          ))}
        </div>
        {cursor && <span className="tl-cursor" style={{ left: `${edgePct(span, cursor.edge)}%` }} />}
      </div>
      <div className="tl-side">
        <span className="tl-price" title={`${priceText(stall.rentalPrice)}/ngày × ${days} ngày = ${priceText(cost)}`}>
          {compactPrice(cost)}
        </span>
        <span className="tl-sum" title={moon.title}>
          <span className={moon.covers ? "tl-moon-on" : "tl-moon-off"}>
            <Icon path={ICONS.moon} size={13} />
          </span>
          <span>{moon.offset}</span>
        </span>
      </div>
    </div>
  );
}

export function RentalDock({ plan, stalls, hoverId, submitLabel, lockedIds, onBack, onHover, onFocus, onSubmit }: Props) {
  const { state, years, viewSpan: span } = plan;
  const { items, cursor, editing, open, year } = state;

  const lines = useMemo(() => buildLines(span), [span]);
  const ticks = useMemo(() => buildTicks(span), [span]);
  const marks = useMemo(() => buildMarks(span), [span]);
  const halos = useMemo(() => moonsIn(span).map((moon) => edgePct(span, moon)), [span]);
  const exts = useMemo(() => buildExts(state.span, span), [state.span, span]);

  const today = vnToday();
  const rows = items.flatMap((item) => {
    const stall = stalls.find((s) => s.id === item.id);
    if (!stall) return [];
    const booked = bookedRanges(stall.bookings);
    const issue = lockedIds?.has(item.id) ? ISSUES.pending : item.start < today ? ISSUES.past : clashes(item, booked) ? ISSUES.clash : null;
    return [{ item, stall, booked, issue }];
  });
  const firstIssue = rows.find((row) => row.issue)?.issue ?? null;
  const total = rows.reduce((sum, row) => sum + row.stall.rentalPrice * rentalDays(row.item), 0);
  const yearIndex = years.indexOf(year);
  const onMark = marks.some((mark) => cursor?.day === mark.num);
  const sameDates = rows.every((row) => row.item.start === rows[0].item.start && row.item.end === rows[0].item.end);

  const edgeField = (which: "from" | "to", label: string) => {
    const text = state.spanText[which];
    const value = which === "from" ? state.span.from : state.span.to;
    return (
      <input
        className={`tl-edge tl-edge-${which}`}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm"
        aria-label={label}
        title={label}
        value={text ?? fullDate(value).slice(0, 5)}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => plan.patch({ spanText: { ...state.spanText, [which]: e.target.value } })}
        onBlur={() => state.spanText[which] !== undefined && plan.applySpanText()}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          else if (e.key === "Escape") {
            plan.patch({ spanText: {} });
            e.currentTarget.blur();
          }
        }}
      />
    );
  };

  return (
    <section className="dock dock-light dock-glass stalls-overlay" aria-label="Lịch thuê">
      <div className="dock-head">
        <h2 className="dock-title">Lịch thuê</h2>
        <div className="year">
          <button type="button" className="year-btn" aria-label="Năm trước" disabled={yearIndex <= 0} onClick={() => plan.setYear(years[yearIndex - 1])}>
            <ChevronLeft size={16} />
          </button>
          <span>{year}</span>
          <button type="button" className="year-btn" aria-label="Năm sau" disabled={yearIndex >= years.length - 1} onClick={() => plan.setYear(years[yearIndex + 1])}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="dock-actions">
          <button type="button" className="year-btn" title="Đặt lại timeline" aria-label="Đặt lại timeline" onClick={plan.resetTimeline}>
            <RotateCcw size={17} />
          </button>
          <button
            type="button"
            className="year-btn"
            title="Dùng ngày của gian đầu cho tất cả"
            aria-label="Dùng ngày của gian đầu cho tất cả"
            disabled={rows.length < 2 || sameDates}
            onClick={plan.linkAll}
          >
            <Link2 size={17} />
          </button>
          <span className="dock-total" title="Tổng giá thuê">
            {priceText(total)}
          </span>
          {onBack && (
            <button type="button" className="dock-back" onClick={onBack}>
              Quay lại
            </button>
          )}
          <button type="button" className="dock-cta" disabled={rows.length === 0 || Boolean(firstIssue)} title={firstIssue ? `Có gian ${firstIssue.title}` : undefined} onClick={onSubmit}>
            {submitLabel}
          </button>
          <button type="button" className="dock-toggle" aria-label={open ? "Thu gọn lịch thuê" : "Mở lịch thuê"} aria-expanded={open} onClick={() => plan.patch({ open: !open, cursor: null })}>
            {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="tl-grid tl-axis-row">
            <span />
            <div className="axis" onPointerMove={plan.onAxisMove} onPointerLeave={plan.onAxisLeave}>
              {marks.map((mark) => (
                <span key={mark.name} className={`mark${mark.moon ? " mark-moon" : ""}${cursor?.day === mark.num ? " mark-on" : ""}`} style={{ left: `${mark.pct}%` }} aria-label={mark.name}>
                  <Icon path={mark.icon} size={16} />
                  <span className="mark-name">
                    <Icon path={mark.icon} size={13} />
                    {mark.name}
                  </span>
                </span>
              ))}
              {ticks
                .filter((tick) => tick.pct > EDGE_CLEAR && tick.pct < 100 - EDGE_CLEAR)
                .map((tick) => (
                  <span key={tick.pct} className={tick.month ? "tick tick-month" : "tick tick-week"} style={{ left: `${tick.pct}%` }}>
                    {tick.label}
                  </span>
                ))}
              {edgeField("from", "Ngày đầu timeline")}
              {edgeField("to", "Ngày cuối timeline")}
              {cursor && !onMark && (
                <span className="tl-tip" style={{ left: `${edgePct(span, cursor.edge)}%` }}>
                  {cursorLabel(cursor.day)}
                </span>
              )}
            </div>
            <span />
          </div>

          <div className="tl-rows">
            {rows.map((row) => (
              <StallRow
                key={row.item.id}
                plan={plan}
                stall={row.stall}
                range={row.item}
                booked={row.booked}
                issue={row.issue}
                isOn={hoverId === row.item.id || editing === row.item.id}
                lines={lines}
                marks={marks}
                halos={halos}
                exts={exts}
                onHover={onHover}
                onFocus={onFocus}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
