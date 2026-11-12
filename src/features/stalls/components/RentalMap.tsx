import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize, Minus, Plus } from "lucide-react";
import type { RentalPlan } from "../hooks/useRentalPlan";
import { bookedRanges, freeRange } from "../timeline";
import { useStalls } from "../hooks/useStalls";
import type { Stall } from "../types";
import { RentalDock } from "./RentalDock";
import { StallMap, type StallMapHandle } from "./StallMap";
import { StallPanel, type StatusFilter } from "./StallPanel";

const PANEL_EDGE = 424;
const DOCK_SPACE = 260;
const NO_STALLS: Stall[] = [];

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
}

function matches(stall: Stall, query: string) {
  const needle = normalize(query.trim());
  if (!needle) return true;
  return normalize(`${stall.name} ${stall.code} ${stall.wardName} ${stall.districtName} ${stall.provinceName}`).includes(needle);
}

interface Props {
  plan: RentalPlan;
  submitLabel: string;
  linkedId?: string | null;
  lockedIds?: Set<string>;
  onBack?: () => void;
  onSubmit: () => void;
}

export function RentalMap({ plan, submitLabel, linkedId, lockedIds, onBack, onSubmit }: Props) {
  const { data, isLoading, isError, refetch } = useStalls();
  const stalls = data ?? NO_STALLS;
  const mapRef = useRef<StallMapHandle>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const found = useMemo(() => stalls.filter((stall) => matches(stall, query)), [stalls, query]);
  const visible = useMemo(() => found.filter((stall) => filter === "all" || stall.status === filter), [found, filter]);
  const visibleIds = useMemo(() => new Set(visible.map((stall) => stall.id)), [visible]);
  const plannedIds = useMemo(() => new Set(plan.state.items.map((item) => item.id)), [plan.state.items]);
  const selected = stalls.find((stall) => stall.id === selectedId) ?? null;
  const hasPlan = plan.state.items.length > 0;

  const pick = (id: string | null) => {
    setSelectedId(id);
    setHoverId(null);
    const stall = stalls.find((s) => s.id === id);
    if (stall) mapRef.current?.focus(stall);
  };

  useEffect(() => {
    if (linkedId && stalls.some((stall) => stall.id === linkedId)) pick(linkedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedId, stalls]);

  const plannedKey = [...plannedIds].sort().join();
  useEffect(() => {
    const planned = stalls.filter((stall) => plannedIds.has(stall.id));
    if (planned.length > 0) mapRef.current?.show(planned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedKey, stalls.length]);

  return (
    <>
      <StallMap
        ref={mapRef}
        stalls={stalls}
        selectedId={selectedId}
        hoverId={hoverId}
        visibleIds={visibleIds}
        plannedIds={plannedIds}
        padding={{ left: PANEL_EDGE, bottom: hasPlan && plan.state.open ? DOCK_SPACE : 0 }}
        onPick={pick}
        onHover={setHoverId}
      />

      <StallPanel
        stalls={stalls}
        found={found}
        visible={visible}
        selected={selected}
        isLoading={isLoading}
        isError={isError}
        query={query}
        filter={filter}
        hoverId={hoverId}
        plannedIds={plannedIds}
        lockedIds={lockedIds}
        onQuery={(value) => {
          setQuery(value);
          setSelectedId(null);
        }}
        onFilter={(value) => {
          setFilter(value);
          setSelectedId(null);
          mapRef.current?.show(found.filter((stall) => value === "all" || stall.status === value));
        }}
        onPick={pick}
        onHover={setHoverId}
        onToggle={(id) => {
          if (lockedIds?.has(id) && !plannedIds.has(id)) return;
          const stall = stalls.find((s) => s.id === id);
          plan.toggle(id, stall ? freeRange(bookedRanges(stall.bookings), plan.state.year) : undefined);
        }}
        mode="rent"
        moonYear={plan.state.year}
        onRetry={() => refetch()}
      />

      <div className="legend stalls-overlay" style={{ position: "absolute", zIndex: 6, top: 16, right: 16 }}>
        <span>
          <span className="legend-dot" style={{ background: "var(--primary)" }} />
          Đang trống
        </span>
        <span>
          <span className="legend-dot" style={{ background: "var(--card)", border: "2px solid #84796b" }} />
          Đang thuê
        </span>
        <span>
          <span className="legend-dot" style={{ background: "var(--primary)", boxShadow: "0 0 0 2px var(--gold)" }} />
          Trong lịch thuê
        </span>
      </div>

      <div className="tools stalls-overlay" style={{ position: "absolute", zIndex: 6, right: 16, top: 62, display: "flex", flexDirection: "column" }}>
        <button
          type="button"
          className="tool"
          aria-label={hasPlan ? "Xem các gian trong lịch thuê" : "Xem tất cả gian hàng"}
          onClick={() => (hasPlan ? mapRef.current?.show(stalls.filter((stall) => plannedIds.has(stall.id))) : mapRef.current?.fit())}
        >
          <Maximize size={19} />
        </button>
        <button type="button" className="tool" aria-label="Phóng to" style={{ borderTop: "1px solid var(--line)" }} onClick={() => mapRef.current?.zoomIn()}>
          <Plus size={19} />
        </button>
        <button type="button" className="tool" aria-label="Thu nhỏ" style={{ borderTop: "1px solid var(--line)" }} onClick={() => mapRef.current?.zoomOut()}>
          <Minus size={19} />
        </button>
      </div>

      {hasPlan && (
        <RentalDock plan={plan} stalls={stalls} hoverId={hoverId} submitLabel={submitLabel} lockedIds={lockedIds} onBack={onBack} onHover={setHoverId} onFocus={pick} onSubmit={onSubmit} />
      )}
    </>
  );
}
