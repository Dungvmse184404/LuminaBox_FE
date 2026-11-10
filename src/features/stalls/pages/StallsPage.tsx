import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useSearchParams } from "react-router-dom";
import { Maximize, Minus, Plus } from "lucide-react";
import { StallMap, type StallMapHandle } from "../components/StallMap";
import { StallPanel, type StatusFilter } from "../components/StallPanel";
import { StallProducts } from "../components/StallProducts";
import { useStalls } from "../hooks/useStalls";
import type { Stall } from "../types";
import "../stalls.css";

const PANEL_EDGE = 424;
const DRAWER_CLOSE_MS = 640;
const NO_STALLS: Stall[] = [];
const NO_PLAN = new Set<string>();

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
}

const matches = (stall: Stall, query: string) => {
  const needle = normalize(query.trim());
  return !needle || normalize(`${stall.name} ${stall.code} ${stall.wardName} ${stall.districtName} ${stall.provinceName}`).includes(needle);
};

export function StallsPage() {
  const { data, isLoading, isError, refetch } = useStalls();
  const stalls = data ?? NO_STALLS;
  const mapRef = useRef<StallMapHandle>(null);
  const [params] = useSearchParams();
  const linkedId = params.get("stall");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("Rented");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname);
  const closing = blocker.state === "blocked";

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => blocker.proceed(), reduced ? 0 : DRAWER_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [blocker]);

  const found = useMemo(() => stalls.filter((stall) => matches(stall, query)), [stalls, query]);
  const visible = useMemo(() => found.filter((stall) => filter === "all" || stall.status === filter), [found, filter]);
  const visibleIds = useMemo(() => new Set(visible.map((stall) => stall.id)), [visible]);
  const selected = stalls.find((stall) => stall.id === selectedId) ?? null;

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

  return (
    <div className="stalls-page">
      <div className={closing ? "stalls-sheet is-closing" : "stalls-sheet"}>
        <StallMap
          ref={mapRef}
          stalls={stalls}
          selectedId={selectedId}
          hoverId={hoverId}
          visibleIds={visibleIds}
          plannedIds={NO_PLAN}
          openStatus="Rented"
          padding={{ left: PANEL_EDGE, bottom: 0 }}
          onPick={pick}
          onHover={setHoverId}
        />

        <StallPanel
          mode="browse"
          stalls={stalls}
          found={found}
          visible={visible}
          selected={selected}
          isLoading={isLoading}
          isError={isError}
          query={query}
          filter={filter}
          hoverId={hoverId}
          plannedIds={NO_PLAN}
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
          onToggle={() => undefined}
          onRetry={() => refetch()}
          renderDetail={(stall) => <StallProducts stall={stall} />}
        />

        <div className="legend stalls-overlay" style={{ position: "absolute", zIndex: 6, top: 16, right: 16 }}>
          <span>
            <span className="legend-dot" style={{ background: "var(--primary)" }} />
            Đang mở bán
          </span>
          <span>
            <span className="legend-dot" style={{ background: "var(--card)", border: "2px solid #84796b" }} />
            Chưa mở bán
          </span>
        </div>

        <div className="tools stalls-overlay" style={{ position: "absolute", zIndex: 6, right: 16, top: 62, display: "flex", flexDirection: "column" }}>
          <button type="button" className="tool" aria-label="Xem tất cả điểm bán" onClick={() => mapRef.current?.fit()}>
            <Maximize size={19} />
          </button>
          <button type="button" className="tool" aria-label="Phóng to" style={{ borderTop: "1px solid var(--line)" }} onClick={() => mapRef.current?.zoomIn()}>
            <Plus size={19} />
          </button>
          <button type="button" className="tool" aria-label="Thu nhỏ" style={{ borderTop: "1px solid var(--line)" }} onClick={() => mapRef.current?.zoomOut()}>
            <Minus size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
