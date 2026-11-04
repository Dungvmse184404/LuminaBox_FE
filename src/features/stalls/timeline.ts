export interface Span {
  from: number;
  to: number;
}

export interface DayRange {
  start: number;
  end: number;
}

const MOON_DATES: Record<number, [number, number]> = { 2027: [8, 15], 2028: [9, 3], 2029: [8, 22], 2030: [8, 12], 2031: [9, 1] };
const TET_DATES: Record<number, [number, number]> = { 2027: [1, 6], 2028: [0, 26], 2029: [1, 13], 2030: [1, 3], 2031: [0, 23] };

export const SEASON_YEARS = [2027, 2028, 2029, 2030];

export const ICONS = {
  moon: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z",
  tet: "M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 10c-3-6 3-6 0 0M14 12c6-3 6 3 0 0M12 14c3 6-3 6 0 0M10 12c-6 3-6-3 0 0",
  flag: "M6 21V4M6 4h12l-3 4 3 4H6",
  newYear: "M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3.5 3.5M14.5 14.5L18 18M18 6l-3.5 3.5M9.5 14.5L6 18",
};

export const dayNum = (year: number, month: number, date: number) => Math.round(Date.UTC(year, month, date) / 86400000);
export const toDate = (num: number) => new Date(num * 86400000);
export const clampDay = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function moonNum(year: number) {
  const [month, date] = MOON_DATES[year];
  return dayNum(year, month, date);
}

export function monthStart(num: number) {
  const date = toDate(num);
  return dayNum(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

export function monthEnd(num: number) {
  const date = toDate(num);
  return dayNum(date.getUTCFullYear(), date.getUTCMonth() + 1, 0);
}

export function seasonSpan(year: number): Span {
  const moon = moonNum(year);
  return { from: monthStart(moon - 45), to: monthEnd(moon + 15) };
}

export function defaultMaster(year: number): DayRange {
  const moon = moonNum(year);
  return { start: moon - 7, end: moon + 3 };
}

export function fitSpan(span: Span, ranges: DayRange[]): Span {
  const from = Math.min(span.from, ...ranges.map((r) => r.start));
  const to = Math.max(span.to, ...ranges.map((r) => r.end));
  if (from === span.from && to === span.to) return span;
  return { from: monthStart(from), to: monthEnd(to) };
}

export function shortDate(num: number) {
  const date = toDate(num);
  return `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
}

export function fullDate(num: number) {
  const date = toDate(num);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

export function parseShort(text: string | undefined, year: number) {
  if (text === undefined) return null;
  const match = text.trim().match(/^(\d{1,2})[/\-.](\d{1,2})$/);
  if (!match) return null;
  const date = Number(match[1]);
  const month = Number(match[2]) - 1;
  const num = dayNum(year, month, date);
  const check = toDate(num);
  return check.getUTCDate() === date && check.getUTCMonth() === month ? num : null;
}

export const spanDays = (span: Span) => span.to - span.from + 1;
export const edgePct = (span: Span, num: number) => Math.round(((num - span.from) / spanDays(span)) * 100000) / 1000;
export const widthPct = (span: Span, days: number) => Math.round((days / spanDays(span)) * 100000) / 1000;

export interface Ext {
  left: number;
  width: number;
}

export function buildExts(applied: Span, view: Span) {
  const exts: Ext[] = [];
  if (view.from < applied.from) exts.push({ left: 0, width: widthPct(view, applied.from - view.from) });
  if (view.to > applied.to) exts.push({ left: edgePct(view, applied.to + 1), width: widthPct(view, view.to - applied.to) });
  return exts;
}

const knownMoons = () => Object.keys(MOON_DATES).map((year) => moonNum(Number(year)));

export const moonsIn = (span: Span) => knownMoons().filter((moon) => moon >= span.from && moon <= span.to);

function nearestMoon(num: number) {
  return knownMoons().reduce((best, moon) => (Math.abs(moon - num) < Math.abs(best - num) ? moon : best));
}

export interface Line {
  month: boolean;
  pct: number;
}

export function buildLines(span: Span) {
  const days = spanDays(span);
  const lines: Line[] = [];
  for (let num = span.from + 1; num <= span.to; num++) {
    const date = toDate(num);
    if (date.getUTCDate() === 1) lines.push({ month: true, pct: edgePct(span, num) });
    else if (date.getUTCDay() === 1 && days <= 240) lines.push({ month: false, pct: edgePct(span, num) });
  }
  return lines;
}

export function buildTicks(span: Span) {
  const days = spanDays(span);
  const compact = days > 150;
  const ticks: { month: boolean; pct: number; label: string }[] = [];
  for (let num = span.from; num <= span.to; num++) {
    const date = toDate(num);
    const month = date.getUTCMonth() + 1;
    const left = monthEnd(num) - num;
    if (date.getUTCDate() === 1) {
      const label = compact ? `T${month}${month === 1 ? `/${date.getUTCFullYear()}` : ""}` : `Tháng ${month}`;
      ticks.push({ month: true, pct: edgePct(span, num), label });
    } else if (date.getUTCDay() === 1 && days <= 100 && date.getUTCDate() > 7 && left > 2) {
      ticks.push({ month: false, pct: edgePct(span, num), label: shortDate(num) });
    }
  }
  return ticks;
}

export function buildSegs(span: Span) {
  const segs: { left: number; width: number; alpha: number; label: string }[] = [];
  const add = (from: number, to: number, alpha: number, label: string) => {
    const start = Math.max(from, span.from);
    const end = Math.min(to, span.to + 1);
    if (end > start) segs.push({ left: edgePct(span, start), width: widthPct(span, end - start), alpha, label });
  };
  let cursor = span.from;
  moonsIn(span).forEach((moon) => {
    add(cursor, moon - 30, 0.05, "Trước Trung thu");
    add(moon - 30, moon - 14, 0.1, "");
    add(moon - 14, moon - 7, 0.19, "");
    add(moon - 7, moon, 0.32, "");
    cursor = moon;
  });
  add(cursor, span.to + 1, 0.05, "Sau Trung thu");
  return segs;
}

export interface Mark {
  moon: boolean;
  icon: string;
  name: string;
  pct: number;
  num: number;
}

export function buildMarks(span: Span): Mark[] {
  const fromYear = toDate(span.from).getUTCFullYear();
  const toYear = toDate(span.to).getUTCFullYear();
  const items: { moon: boolean; icon: string; name: string; num: number }[] = [];
  for (let year = fromYear; year <= toYear; year++) {
    if (MOON_DATES[year]) items.push({ moon: true, icon: ICONS.moon, name: "Trung thu", num: moonNum(year) });
    if (TET_DATES[year]) items.push({ moon: false, icon: ICONS.tet, name: "Tết Nguyên đán", num: dayNum(year, TET_DATES[year][0], TET_DATES[year][1]) });
    items.push({ moon: false, icon: ICONS.newYear, name: "Tết Dương lịch", num: dayNum(year, 0, 1) });
    items.push({ moon: false, icon: ICONS.flag, name: "Giải phóng miền Nam", num: dayNum(year, 3, 30) });
    items.push({ moon: false, icon: ICONS.star, name: "Quốc khánh", num: dayNum(year, 8, 2) });
  }
  return items
    .filter((item) => item.num >= span.from && item.num <= span.to)
    .map((item) => ({ ...item, name: `${item.name} ${shortDate(item.num)}`, pct: edgePct(span, item.num) }));
}

export function cursorLabel(num: number) {
  const distance = num - nearestMoon(num);
  const offset = distance === 0 ? "" : ` ${distance < 0 ? "−" : "+"}${Math.abs(distance)}d`;
  return `${fullDate(num).slice(0, 5)} (Trung thu${offset})`;
}

export function moonSummary(range: DayRange) {
  const length = range.end - range.start + 1;
  const moon = nearestMoon((range.start + range.end) / 2);
  const covers = range.start <= moon && range.end >= moon;
  const distance = range.end < moon ? range.end - moon : range.start - moon;
  const offset = covers ? "" : `${distance < 0 ? "−" : "+"}${Math.abs(distance)}`;
  const title = covers
    ? `${length} ngày, có Trung thu`
    : `${length} ngày, cách Trung thu ${Math.abs(distance)} ngày`;
  return { covers, offset, title };
}

export const rentalDays = (range: DayRange) => range.end - range.start + 1;

export function compactPrice(value: number) {
  if (value < 1000000) return `${Math.round(value / 1000)}k`;
  return `${String(Math.round(value / 100000) / 10).replace(".", ",")}tr`;
}

export const priceText = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;
