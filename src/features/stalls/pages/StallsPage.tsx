import { useMemo, useRef, useState } from "react";
import { Maximize, Minus, Plus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { RentalDock } from "../components/RentalDock";
import { StallMap, type StallMapHandle } from "../components/StallMap";
import { StallPanel, type StatusFilter } from "../components/StallPanel";
import { useRentalPlan } from "../hooks/useRentalPlan";
import { useStalls } from "../hooks/useStalls";
import type { Stall } from "../types";
import "../stalls.css";

const PANEL_EDGE = 424;
const NO_STALLS: Stall[] = [];

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
}

function matches(stall: Stall, query: string) {
  const needle = normalize(query.trim());
  if (!needle) return true;
  return normalize(`${stall.name} ${stall.code} ${stall.wardName} ${stall.districtName} ${stall.provinceName}`).includes(needle);
}

export function StallsPage() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useStalls();
  const stalls = data ?? NO_STALLS;
  const plan = useRentalPlan();
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

  const pick = (id: string | null) => {
    setSelectedId(id);
    setHoverId(null);
    const stall = stalls.find((s) => s.id === id);
    if (stall) mapRef.current?.focus(stall);
  };

  return (
    <div className="stalls-page">
      <div className="stalls-sheet">
        <StallMap
          ref={mapRef}
          stalls={stalls}
          selectedId={selectedId}
          hoverId={hoverId}
          visibleIds={visibleIds}
          plannedIds={plannedIds}
          padding={{ left: PANEL_EDGE, bottom: plan.state.items.length > 0 ? 260 : 0 }}
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
          onQuery={(value) => {
            setQuery(value);
            setSelectedId(null);
          }}
          onFilter={(value) => {
            setFilter(value);
            setSelectedId(null);
          }}
          onPick={pick}
          onHover={setHoverId}
          onToggle={plan.toggle}
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

        <div className="tools stalls-overlay" style={{ position: "absolute", zIndex: 6, right: 16, top: 62, display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 12, border: "1px solid var(--line)", boxShadow: "var(--shadow-card)" }}>
          <button type="button" className="tool" aria-label="Xem tất cả gian hàng" onClick={() => mapRef.current?.fit()}>
            <Maximize size={19} />
          </button>
          <button type="button" className="tool" aria-label="Phóng to" style={{ borderTop: "1px solid var(--line)" }} onClick={() => mapRef.current?.zoomIn()}>
            <Plus size={19} />
          </button>
          <button type="button" className="tool" aria-label="Thu nhỏ" style={{ borderTop: "1px solid var(--line)" }} onClick={() => mapRef.current?.zoomOut()}>
            <Minus size={19} />
          </button>
        </div>

        {plan.state.items.length > 0 && (
          <RentalDock
            plan={plan}
            stalls={stalls}
            hoverId={hoverId}
            onHover={setHoverId}
            onFocus={pick}
            onSubmit={() => toast.error("Chưa gửi được: API đăng ký thuê gian hàng chưa có.")}
          />
        )}
      </div>
    </div>
  );
}
