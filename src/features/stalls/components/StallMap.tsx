import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { LngLatBounds, Map as MapLibre, Marker, setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { env } from "@/lib/env";
import type { Stall } from "../types";

export interface StallMapHandle {
  fit: () => void;
  focus: (stall: Stall) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface Props {
  stalls: Stall[];
  selectedId: string | null;
  hoverId: string | null;
  visibleIds: Set<string>;
  plannedIds: Set<string>;
  padding: { left: number; bottom: number };
  onPick: (id: string) => void;
  onHover: (id: string | null) => void;
}

setWorkerUrl(workerUrl);

const VIETNAM: [number, number] = [106.7, 16.2];
const STORE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10l1.5-5h13L20 10M5 10v9h14v-9M4 10a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 19v-5h4v5"/></svg>';

const hasPosition = (stall: Stall) => stall.latitude !== null && stall.longitude !== null;

function mapStyle(): StyleSpecification {
  const land = { id: "land", type: "background", paint: { "background-color": "#f6ecdd" } } as const;
  if (!env.vietmapTilemapKey) return { version: 8, sources: {}, layers: [land] };

  return {
    version: 8,
    sources: {
      vietmap: {
        type: "raster",
        tiles: [`https://maps.vietmap.vn/maps/tiles/tm/{z}/{x}/{y}@2x.png?apikey=${env.vietmapTilemapKey}`],
        tileSize: 256,
        attribution: "© VietMap",
      },
    },
    layers: [land, { id: "vietmap", type: "raster", source: "vietmap" }],
  };
}

export const StallMap = forwardRef<StallMapHandle, Props>(function StallMap(
  { stalls, selectedId, hoverId, visibleIds, plannedIds, padding, onPick, onHover },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const markersRef = useRef(new globalThis.Map<string, { marker: Marker; pin: HTMLButtonElement; tag: HTMLSpanElement }>());
  const paddingRef = useRef(padding);
  paddingRef.current = padding;
  const handlersRef = useRef({ onPick, onHover });
  handlersRef.current = { onPick, onHover };

  const mapPadding = () => ({ top: 60, right: 60, left: paddingRef.current.left + 40, bottom: paddingRef.current.bottom + 40 });

  const fit = () => {
    const map = mapRef.current;
    const placed = stalls.filter(hasPosition);
    if (!map || placed.length === 0) return;
    const bounds = new LngLatBounds();
    placed.forEach((stall) => bounds.extend([stall.longitude!, stall.latitude!]));
    map.fitBounds(bounds, { padding: mapPadding(), maxZoom: 13, duration: 650 });
  };

  useImperativeHandle(ref, () => ({
    fit,
    focus: (stall) => {
      if (!hasPosition(stall)) return;
      mapRef.current?.flyTo({ center: [stall.longitude!, stall.latitude!], zoom: 14, padding: mapPadding(), duration: 650 });
    },
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibre({ container: containerRef.current, style: mapStyle(), center: VIETNAM, zoom: 5, attributionControl: { compact: true } });
    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const wanted = new Set(stalls.filter(hasPosition).map((stall) => stall.id));

    markers.forEach((entry, id) => {
      if (wanted.has(id)) return;
      entry.marker.remove();
      markers.delete(id);
    });

    stalls.filter(hasPosition).forEach((stall) => {
      if (markers.has(stall.id)) return;
      const element = document.createElement("div");
      element.className = "pin-marker";
      const pin = document.createElement("button");
      pin.type = "button";
      pin.setAttribute("aria-label", stall.name);
      pin.innerHTML = `<span class="pin-hit"></span><span class="pin-head">${STORE_ICON}</span>`;
      const tag = document.createElement("span");
      tag.className = "pin-tag";
      tag.textContent = stall.name;
      pin.append(tag);
      pin.addEventListener("click", (event) => {
        event.stopPropagation();
        handlersRef.current.onPick(stall.id);
      });
      pin.addEventListener("mouseenter", () => handlersRef.current.onHover(stall.id));
      pin.addEventListener("mouseleave", () => handlersRef.current.onHover(null));
      element.append(pin);
      const marker = new Marker({ element, anchor: "center" }).setLngLat([stall.longitude!, stall.latitude!]).addTo(map);
      markers.set(stall.id, { marker, pin, tag });
    });

    fit();
    // Fitting again on every hover or filter change would move the map under the pointer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stalls]);

  useEffect(() => {
    stalls.forEach((stall) => {
      const entry = markersRef.current.get(stall.id);
      if (!entry) return;
      const isOn = stall.id === selectedId;
      const isHover = stall.id === hoverId;
      const classes = ["pin", stall.status === "Available" ? "pin-free" : "pin-rented"];
      if (isOn) classes.push("pin-on");
      if (isHover) classes.push("pin-hover");
      if (!visibleIds.has(stall.id) && !isOn) classes.push("pin-dim");
      if (plannedIds.has(stall.id)) classes.push("pin-cart");
      entry.pin.className = classes.join(" ");
      entry.tag.style.display = isOn || isHover ? "" : "none";
      entry.marker.getElement().style.zIndex = isOn ? "5" : isHover ? "4" : "2";
    });
  }, [stalls, selectedId, hoverId, visibleIds, plannedIds]);

  return <div ref={containerRef} className="stalls-map" />;
});
