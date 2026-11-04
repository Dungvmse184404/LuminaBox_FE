import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Map as MapLibre, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { vietmapStyle } from "@/lib/vietmapStyle";
import { vietmapApi, type Place } from "../api/vietmapApi";
import { AddressAutocomplete, type AutocompleteOption } from "./AddressAutocomplete";

export interface MapFocus {
  lat: number;
  lng: number;
  zoom: number;
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  focus: MapFocus | null;
  onPick: (lat: number, lng: number) => void;
}

const HO_CHI_MINH: [number, number] = [106.6297, 10.8231];
const COORDINATE_DIGITS = 6;
const SEARCH_DELAY = 400;
const FOCUS_DURATION = 1600;
const PICK_DURATION = 900;
const PLACE_ZOOM = 15;
const round = (value: number) => Number(value.toFixed(COORDINATE_DIGITS));
const CONTROL = "grid size-9 place-items-center bg-card text-ink-soft transition hover:text-primary";

function pinElement() {
  const element = document.createElement("div");
  element.className = "relative h-[42px] w-[30px] cursor-grab text-primary";
  element.innerHTML = `
    <span class="absolute left-1/2 top-3.5 size-11 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-primary/25"></span>
    <svg class="relative drop-shadow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42" aria-hidden="true">
      <path d="M15 0C7.27 0 1 6.27 1 14c0 10.5 14 28 14 28S29 24.5 29 14C29 6.27 22.73 0 15 0z" fill="currentColor"/>
      <circle cx="15" cy="14" r="6" fill="white"/>
    </svg>`;
  return element;
}

export function AddressMap({ latitude, longitude, focus, onPick }: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [host] = useState(() => {
    const element = document.createElement("div");
    element.dataset.addressFields = "";
    return element;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const searchTimer = useRef(0);
  const searchRun = useRef(0);

  const [fullscreen, setFullscreen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);

  const moveTo = (lat: number, lng: number, zoom?: number) => {
    onPickRef.current(round(lat), round(lng));
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: PICK_DURATION, essential: true });
  };

  useLayoutEffect(() => {
    host.className = fullscreen ? "fixed inset-0 z-[100] bg-cream" : "size-full";
    (fullscreen ? document.body : slotRef.current!).appendChild(host);
    mapRef.current?.resize();
  }, [fullscreen, host]);

  useEffect(() => () => host.remove(), [host]);

  useEffect(() => {
    const hasPin = latitude !== null && longitude !== null;
    const map = new MapLibre({
      container: containerRef.current!,
      style: vietmapStyle(),
      center: hasPin ? [longitude, latitude] : HO_CHI_MINH,
      zoom: hasPin ? PLACE_ZOOM : 10,
      attributionControl: false,
    });
    map.getCanvas().style.cursor = "crosshair";
    map.on("click", (event) => moveTo(event.lngLat.lat, event.lngLat.lng));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (latitude === null || longitude === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const marker = new Marker({ element: pinElement(), anchor: "bottom", draggable: true }).setLngLat([longitude, latitude]).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLngLat();
        onPickRef.current(round(lat), round(lng));
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (focus) mapRef.current?.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom, duration: FOCUS_DURATION, essential: true });
  }, [focus]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setFullscreen(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [fullscreen]);

  const locateMe = () =>
    navigator.geolocation?.getCurrentPosition(({ coords }) => moveTo(coords.latitude, coords.longitude, PLACE_ZOOM));

  const onSearchText = (text: string) => {
    setQuery(text);
    window.clearTimeout(searchTimer.current);
    const run = ++searchRun.current;
    if (!text.trim()) return setResults([]);

    searchTimer.current = window.setTimeout(async () => {
      const center = mapRef.current?.getCenter();
      const found = await vietmapApi.search(text, center ? { lat: center.lat, lng: center.lng } : undefined);
      if (run === searchRun.current) setResults(found);
    }, SEARCH_DELAY);
  };

  const pickResult = async (option: AutocompleteOption | null) => {
    if (!option) return;
    window.clearTimeout(searchTimer.current);
    searchRun.current += 1;
    setQuery(option.name);
    setResults([]);
    const position = await vietmapApi.coordinates(option.id);
    if (position) moveTo(position.lat, position.lng, PLACE_ZOOM);
  };

  const hasPin = latitude !== null && longitude !== null;

  const content = (
    <div className="relative size-full">
      <div className={cn("size-full overflow-hidden", !fullscreen && "rounded-xl border border-line")}>
        <div ref={containerRef} className="size-full" />
      </div>

      {vietmapApi.enabled && (
        <div
          className="absolute left-3 right-14 top-3 z-10 max-w-xs rounded-lg bg-card shadow-md"
          onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
        >
          <AddressAutocomplete
            freeText
            ariaLabel="Tìm địa điểm trên bản đồ"
            placeholder="Tìm kiếm địa điểm..."
            options={results.map((place) => ({ id: place.id, name: place.label, hint: place.hint }))}
            text={query}
            onTextChange={onSearchText}
            onPick={pickResult}
          />
        </div>
      )}

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          aria-label={fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          onClick={() => setFullscreen((value) => !value)}
          className={cn(CONTROL, "rounded-lg shadow-md")}
        >
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <div className="flex flex-col divide-y divide-line overflow-hidden rounded-lg shadow-md">
          <button type="button" aria-label="Phóng to" onClick={() => mapRef.current?.zoomIn()} className={CONTROL}>
            <Plus size={16} />
          </button>
          <button type="button" aria-label="Thu nhỏ" onClick={() => mapRef.current?.zoomOut()} className={CONTROL}>
            <Minus size={16} />
          </button>
        </div>
        <button type="button" aria-label="Vị trí của tôi" onClick={locateMe} className={cn(CONTROL, "rounded-lg shadow-md")}>
          <LocateFixed size={16} />
        </button>
      </div>

      {hasPin && (
        <p className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-card px-3 py-1.5 text-xs text-ink-soft shadow-md">
          {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
        </p>
      )}
    </div>
  );

  return (
    <>
      <div ref={slotRef} className="h-72" />
      {createPortal(content, host)}
    </>
  );
}
