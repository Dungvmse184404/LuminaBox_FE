import { useRef, useEffect } from "react";
import { Check, ChevronLeft, MapPin, Plus, Search, X } from "lucide-react";
import { priceText } from "../timeline";
import type { Stall, StallStatus } from "../types";

export type StatusFilter = "all" | StallStatus;

interface Props {
  stalls: Stall[];
  found: Stall[];
  visible: Stall[];
  selected: Stall | null;
  isLoading: boolean;
  isError: boolean;
  query: string;
  filter: StatusFilter;
  hoverId: string | null;
  plannedIds: Set<string>;
  onQuery: (value: string) => void;
  onFilter: (value: StatusFilter) => void;
  onPick: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onToggle: (id: string) => void;
  onRetry: () => void;
}

const statusText = (stall: Stall) => (stall.status === "Available" ? "Đang trống" : "Đang thuê");
const statusClass = (stall: Stall) => (stall.status === "Available" ? "status status-free" : "status status-rented");
const location = (stall: Stall) => `${stall.wardName}, ${stall.districtName}, ${stall.provinceName}`;
const dayPrice = (value: number) => `${priceText(value)}/ngày`;

function distanceKm(a: Stall, b: Stall) {
  if (a.latitude === null || a.longitude === null || b.latitude === null || b.longitude === null) return null;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function StallPanel({ stalls, found, visible, selected, isLoading, isError, query, filter, hoverId, plannedIds, onQuery, onFilter, onPick, onHover, onToggle, onRetry }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [selected]);

  const chips: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "Tất cả", count: found.length },
    { id: "Available", label: "Đang trống", count: found.filter((s) => s.status === "Available").length },
    { id: "Rented", label: "Đang thuê", count: found.filter((s) => s.status === "Rented").length },
  ];

  const nearby = selected
    ? stalls
        .filter((s) => s.id !== selected.id)
        .map((stall) => ({ stall, km: distanceKm(selected, stall) }))
        .filter((item): item is { stall: Stall; km: number } => item.km !== null)
        .sort((a, b) => a.km - b.km)
        .slice(0, 5)
    : [];

  const row = (stall: Stall, extra: string) => {
    const planned = plannedIds.has(stall.id);
    return (
      <div key={stall.id} className="row-wrap">
        <button
          type="button"
          className={hoverId === stall.id ? "row row-hover" : "row"}
          onClick={() => onPick(stall.id)}
          onMouseEnter={() => onHover(stall.id)}
          onMouseLeave={() => onHover(null)}
        >
          <span className="row-top">
            <span className="row-name">{stall.name}</span>
            <span className="row-code">{extra}</span>
          </span>
          <span className="row-loc" style={{ display: "block" }}>
            {location(stall)}
          </span>
          <span className="row-meta">
            <span className="price">{dayPrice(stall.rentalPrice)}</span>
            <span className={statusClass(stall)}>{statusText(stall)}</span>
          </span>
        </button>
        {stall.status === "Available" && (
          <button
            type="button"
            className="row-add"
            aria-pressed={planned}
            aria-label={planned ? `Bỏ ${stall.name} khỏi lịch thuê` : `Thêm ${stall.name} vào lịch thuê`}
            onClick={() => onToggle(stall.id)}
          >
            {planned ? <Check size={18} /> : <Plus size={18} />}
          </button>
        )}
      </div>
    );
  };

  return (
    <aside className="panel panel-glass stalls-overlay" aria-label="Danh sách gian hàng">
      <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 10, padding: "12px 12px 8px" }}>
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder="Tìm theo tên, mã hoặc khu vực" aria-label="Tìm gian hàng" value={query} onChange={(e) => onQuery(e.target.value)} />
          {query && (
            <button type="button" className="icon-btn" aria-label="Xoá từ khoá" onClick={() => onQuery("")}>
              <X size={16} />
            </button>
          )}
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {chips.map((chip) => (
            <button key={chip.id} type="button" className="chip" aria-pressed={filter === chip.id} onClick={() => onFilter(chip.id)}>
              {chip.label} ({chip.count})
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="panel-scroll">
        {selected ? (
          <>
            <button type="button" className="back" onClick={() => onPick(null)}>
              <ChevronLeft size={18} />
              Tất cả gian hàng
            </button>
            <section className="detail" aria-label="Chi tiết gian hàng" style={{ marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span className={statusClass(selected)}>{statusText(selected)}</span>
                <span className="row-code">{selected.code}</span>
              </div>
              <h2 className="break-words" style={{ margin: "8px 0 0", fontFamily: "Merriweather, Georgia, serif", fontSize: 20, lineHeight: 1.3, color: "var(--primary-dark)" }}>
                {selected.name}
              </h2>
              <p className="break-words" style={{ display: "flex", gap: 6, margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.45, color: "var(--ink-soft)" }}>
                <MapPin size={16} style={{ flex: "none", marginTop: 2 }} aria-hidden="true" />
                <span className="min-w-0">
                  {selected.addressLine}, {location(selected)}
                </span>
              </p>
              {(selected.latitude === null || selected.longitude === null) && (
                <p style={{ margin: "6px 0 0 22px", fontSize: 12.5, color: "var(--ink-soft)" }}>Gian này chưa có vị trí trên bản đồ.</p>
              )}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Giá thuê</div>
                <div className="price" style={{ marginTop: 2, fontSize: 19 }}>
                  {dayPrice(selected.rentalPrice)}
                </div>
              </div>
              {selected.description && (
                <p className="break-words" style={{ margin: "12px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-soft)" }}>
                  {selected.description}
                </p>
              )}
              {selected.status === "Rented" ? (
                <button type="button" className="cta" disabled>
                  Đang có người thuê
                </button>
              ) : plannedIds.has(selected.id) ? (
                <button type="button" className="cta cta-ghost" onClick={() => onToggle(selected.id)}>
                  Bỏ khỏi lịch thuê
                </button>
              ) : (
                <button type="button" className="cta" onClick={() => onToggle(selected.id)}>
                  Thêm vào lịch thuê
                </button>
              )}
            </section>
            {nearby.length > 0 && <h3 className="section-title">Gian hàng gần đây</h3>}
            {nearby.map((item) => row(item.stall, `${item.km.toFixed(1).replace(".", ",")} km`))}
          </>
        ) : (
          <>
            <p style={{ margin: "4px 4px 6px", fontSize: 13, color: "var(--ink-soft)" }}>{isLoading ? "Đang tải gian hàng..." : `${visible.length} gian hàng`}</p>
            {visible.map((stall) => row(stall, stall.code))}
            {isError && (
              <div style={{ padding: "28px 16px", textAlign: "center" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Không tải được danh sách gian hàng</p>
                <button type="button" className="chip" style={{ marginTop: 10 }} onClick={onRetry}>
                  Thử lại
                </button>
              </div>
            )}
            {!isLoading && !isError && visible.length === 0 && (
              <div style={{ padding: "28px 16px", textAlign: "center" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Không tìm thấy gian hàng phù hợp</p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-soft)" }}>Thử từ khoá khác hoặc bỏ bộ lọc trạng thái.</p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
