import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Link2, RotateCcw, X } from "lucide-react";
import type { RentalPlan } from "../hooks/useRentalPlan";
import {
  buildLines,
  buildMarks,
  buildSegs,
  buildTicks,
  compactPrice,
  cursorLabel,
  edgePct,
  fullDate,
  ICONS,
  moonsIn,
  moonSummary,
  priceText,
  rentalDays,
  SEASON_YEARS,
  shortDate,
  widthPct,
  type DayRange,
  type Line,
  type Mark,
} from "../timeline";
import type { Stall } from "../types";

const LINKED_GROUP_MIN = 4;

interface Props {
  plan: RentalPlan;
  stalls: Stall[];
  hoverId: string | null;
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

function TrackLines({ lines, soft, halos }: { lines: Line[]; soft?: boolean; halos: number[] }) {
  return (
    <>
      {halos.map((pct) => (
        <span key={pct} className={soft ? "halo halo-soft" : "halo"} style={{ left: `${pct}%` }} />
      ))}
      {lines.map((line) => (
        <span key={line.pct} className={line.month ? "tl-line tl-line-month" : "tl-line"} style={{ left: `${line.pct}%` }} />
      ))}
    </>
  );
}

function StallRow({
  plan,
  stall,
  range,
  custom,
  isOn,
  lines,
  marks,
  halos,
  onHover,
  onFocus,
}: {
  plan: RentalPlan;
  stall: Stall;
  range: DayRange;
  custom: boolean;
  isOn: boolean;
  lines: Line[];
  marks: Mark[];
  halos: number[];
  onHover: (id: string | null) => void;
  onFocus: (id: string) => void;
}) {
  const span = plan.viewSpan;
  const days = rentalDays(range);
  const cost = stall.rentalPrice * days;
  const moon = moonSummary(range);
  const { cursor } = plan.state;

  return (
    <div className="tl-grid tl-row" onMouseEnter={() => onHover(stall.id)} onMouseLeave={() => onHover(null)}>
      <div className="tl-name">
        <button type="button" className="tl-link" title={stall.name} onClick={() => onFocus(stall.id)}>
          {shortName(stall.name)}
        </button>
        {custom && (
          <button type="button" className="tl-remove" aria-label={`Cho ${stall.name} dùng lại lịch chung`} title="Dùng lại lịch chung" onClick={() => plan.relink(stall.id)}>
            <Link2 size={14} />
          </button>
        )}
        <button type="button" className="tl-remove" aria-label={`Bỏ ${stall.name} khỏi lịch thuê`} onClick={() => plan.toggle(stall.id)}>
          <X size={13} />
        </button>
      </div>
      <div className="track" onPointerDown={(e) => plan.onTrackDown(stall.id, e)} onPointerMove={plan.onAxisMove} onPointerLeave={plan.onAxisLeave}>
        <div className="track-in">
          <TrackLines lines={lines} halos={halos} soft />
        </div>
        <div
          className={`bar${custom ? "" : " bar-linked"}${isOn ? " bar-on" : ""}`}
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

export function RentalDock({ plan, stalls, hoverId, onHover, onFocus, onSubmit }: Props) {
  const { state, viewSpan: span } = plan;
  const { items, master, cursor, editing, confirming, sent, open, year } = state;
  const [linkedOpen, setLinkedOpen] = useState(false);

  const lines = useMemo(() => buildLines(span), [span]);
  const ticks = useMemo(() => buildTicks(span), [span]);
  const segs = useMemo(() => buildSegs(span), [span]);
  const marks = useMemo(() => buildMarks(span), [span]);
  const halos = useMemo(() => moonsIn(span).map((moon) => edgePct(span, moon)), [span]);

  const rows = items.flatMap((item) => {
    const stall = stalls.find((s) => s.id === item.id);
    return stall ? [{ item, stall, range: plan.rangeOf(item) }] : [];
  });
  const total = rows.reduce((sum, row) => sum + row.stall.rentalPrice * rentalDays(row.range), 0);
  const linked = rows.filter((row) => !row.item.custom);
  const grouped = linked.length >= LINKED_GROUP_MIN;
  const shown = grouped && !linkedOpen ? rows.filter((row) => row.item.custom) : rows;
  const yearIndex = SEASON_YEARS.indexOf(year);
  const onMark = marks.some((mark) => cursor?.day === mark.num);
  const moon = moonSummary(master);

  const spanField = (which: "from" | "to", label: string) => {
    const text = state.spanText[which];
    const value = which === "from" ? state.span.from : state.span.to;
    return (
      <input
        className="tl-edge"
        type="text"
        inputMode="numeric"
        placeholder="dd/mm"
        aria-label={label}
        value={text ?? fullDate(value).slice(0, 5)}
        onChange={(e) => plan.patch({ spanText: { ...state.spanText, [which]: e.target.value } })}
        onBlur={() => state.spanText[which] !== undefined && plan.patch({ spanText: {} })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            plan.applySpanText();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            plan.patch({ spanText: {} });
            e.currentTarget.blur();
          }
        }}
      />
    );
  };

  const submit = () => {
    if (sent) return;
    if (!confirming) {
      plan.patch({ confirming: true });
      return;
    }
    plan.patch({ confirming: false });
    onSubmit();
  };

  return (
    <section className={`dock dock-glass stalls-overlay${confirming ? " dock-confirm" : ""}`} aria-label="Lịch thuê">
      <div className="dock-head">
        <h2 className="dock-title">Lịch thuê</h2>
        <div className="year">
          <button type="button" className="year-btn" aria-label="Năm trước" disabled={yearIndex <= 0} onClick={() => plan.setYear(SEASON_YEARS[yearIndex - 1])}>
            <ChevronLeft size={16} />
          </button>
          <span>{year}</span>
          <button type="button" className="year-btn" aria-label="Năm sau" disabled={yearIndex >= SEASON_YEARS.length - 1} onClick={() => plan.setYear(SEASON_YEARS[yearIndex + 1])}>
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
            title="Đặt lại ngày các gian theo lịch chung"
            aria-label="Đặt lại ngày các gian theo lịch chung"
            disabled={!items.some((item) => item.custom)}
            onClick={plan.resetStalls}
          >
            <Link2 size={17} />
          </button>
          <span className="dock-total" title="Tổng giá thuê">
            {priceText(total)}
          </span>
          <button
            type="button"
            className={`dock-cta${confirming ? " is-confirm" : ""}${sent ? " is-sent" : ""}`}
            onClick={submit}
            onBlur={() => confirming && plan.patch({ confirming: false })}
          >
            {sent ? "Đã gửi" : confirming ? "Xác nhận ?" : `Gửi đăng ký (${items.length})`}
          </button>
          <button type="button" className="dock-toggle" aria-label={open ? "Thu gọn lịch thuê" : "Mở lịch thuê"} aria-expanded={open} onClick={() => plan.patch({ open: !open, cursor: null })}>
            {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="tl-grid tl-axis-row">
            <div className="axis-side">
              <span className="tl-label">Lịch chung</span>
              {spanField("from", "Ngày đầu timeline")}
            </div>
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
              {ticks.map((tick) => (
                <span key={tick.pct} className={tick.month ? "tick tick-month" : "tick tick-week"} style={{ left: `${tick.pct}%` }}>
                  {tick.label}
                </span>
              ))}
              <div className="lane-box">
                <div className="lane">
                  {segs.map((seg) => (
                    <div key={seg.left} className="seg" style={{ left: `${seg.left}%`, width: `${seg.width}%`, background: `rgba(var(--dk-glow), ${seg.alpha})` }}>
                      <span>{seg.label}</span>
                    </div>
                  ))}
                  <TrackLines lines={lines} halos={halos} />
                  {marks.map((mark) => (
                    <span key={mark.name} className={mark.moon ? "tl-mark-line tl-mark-moon" : "tl-mark-line"} style={{ left: `${mark.pct}%` }} />
                  ))}
                </div>
                {cursor && <span className="tl-cursor" style={{ left: `${edgePct(span, cursor.edge)}%` }} />}
              </div>
              <div className={editing === "master" ? "knob-lane is-editing" : "knob-lane"}>
                <div
                  className="knob-band"
                  style={{ left: `${edgePct(span, master.start)}%`, width: `${widthPct(span, rentalDays(master))}%` }}
                  onPointerDown={(e) => plan.startDrag(null, "move", e, master)}
                />
                <button
                  type="button"
                  className="knob"
                  style={{ left: `${edgePct(span, master.start)}%` }}
                  aria-label="Ngày bắt đầu chung"
                  onPointerDown={(e) => plan.startDrag(null, "start", e, master)}
                  onKeyDown={(e) => plan.nudge(null, "start", e)}
                >
                  <span className="knob-hit" />
                  <span className="knob-date knob-date-l">{shortDate(master.start)}</span>
                </button>
                <button
                  type="button"
                  className="knob"
                  style={{ left: `${edgePct(span, master.end + 1)}%` }}
                  aria-label="Ngày kết thúc chung"
                  onPointerDown={(e) => plan.startDrag(null, "end", e, master)}
                  onKeyDown={(e) => plan.nudge(null, "end", e)}
                >
                  <span className="knob-hit" />
                  <span className="knob-date knob-date-r">{shortDate(master.end)}</span>
                </button>
              </div>
              {cursor && !onMark && (
                <span className="tl-tip" style={{ left: `${edgePct(span, cursor.edge)}%` }}>
                  {cursorLabel(cursor.day)}
                </span>
              )}
            </div>
            <div className="axis-side">{spanField("to", "Ngày cuối timeline")}</div>
          </div>

          <div className="tl-rows">
            {grouped && (
              <div className="tl-grid tl-row">
                <button type="button" className="tl-group" aria-expanded={linkedOpen} onClick={() => setLinkedOpen((value) => !value)}>
                  {linkedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {linked.length} gian theo lịch chung
                </button>
                <div className="track">
                  <div className="track-in">
                    <TrackLines lines={lines} halos={halos} soft />
                  </div>
                  <div className="bar bar-linked" style={{ left: `${edgePct(span, master.start)}%`, width: `${widthPct(span, rentalDays(master))}%`, pointerEvents: "none" }}>
                    <div className="bar-fill" />
                    <span className="bar-days">{rentalDays(master)}d</span>
                  </div>
                </div>
                <div className="tl-side">
                  <span className="tl-price">{compactPrice(linked.reduce((sum, row) => sum + row.stall.rentalPrice * rentalDays(row.range), 0))}</span>
                  <span className="tl-sum" title={moon.title}>
                    <span className={moon.covers ? "tl-moon-on" : "tl-moon-off"}>
                      <Icon path={ICONS.moon} size={13} />
                    </span>
                    <span>{moon.offset}</span>
                  </span>
                </div>
              </div>
            )}
            {shown.map((row) => (
              <StallRow
                key={row.item.id}
                plan={plan}
                stall={row.stall}
                range={row.range}
                custom={row.item.custom}
                isOn={hoverId === row.item.id || editing === row.item.id || (editing === "master" && !row.item.custom)}
                lines={lines}
                marks={marks}
                halos={halos}
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
