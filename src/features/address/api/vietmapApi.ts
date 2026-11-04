import { env } from "@/lib/env";

const BASE = "https://maps.vietmap.vn/api";

interface Boundary {
  type: 0 | 1 | 2;
  full_name: string;
}

interface SearchResult {
  ref_id: string;
  name: string;
  address: string;
  boundaries?: Boundary[];
}

export interface Place {
  id: string;
  name: string;
  label: string;
  hint: string;
  province: string;
  district: string;
  ward: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

async function get<T>(path: string, query: Record<string, string | number>): Promise<T | null> {
  const params = new URLSearchParams({ apikey: env.vietmapKey });
  for (const [key, value] of Object.entries(query)) params.set(key, String(value));
  try {
    const response = await fetch(`${BASE}/${path}?${params}`);
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

const boundary = (result: SearchResult, type: Boundary["type"]) => result.boundaries?.find((b) => b.type === type)?.full_name ?? "";

const AREA_PART = /^(phường|xã|thị trấn|quận|huyện|thị xã|thành phố|tỉnh)\s/i;

function toPlace(result: SearchResult): Place {
  const parts = result.address.split(",").map((part) => part.trim());
  const street = parts[0] && !AREA_PART.test(parts[0]) ? parts[0] : result.name;
  return {
    id: result.ref_id,
    name: street.replace(/(^|\s)Đường\s+/i, "$1").trim(),
    label: result.name || street,
    hint: parts.filter((part) => AREA_PART.test(part)).join(", "),
    province: boundary(result, 0),
    district: boundary(result, 1),
    ward: boundary(result, 2),
  };
}

const located = new Map<string, Coordinates>();

export const vietmapApi = {
  enabled: Boolean(env.vietmapKey),

  search: async (text: string, focus?: Coordinates) => {
    const results = await get<SearchResult[]>("autocomplete/v3", focus ? { text, focus: `${focus.lat},${focus.lng}` } : { text });
    return (results ?? []).map(toPlace).filter((place) => place.name);
  },

  streets: async (text: string) => {
    const places = await vietmapApi.search(text);
    return places.filter((place, index) => places.findIndex((other) => other.name === place.name && other.hint === place.hint) === index);
  },

  coordinates: async (refId: string) => {
    const place = await get<Coordinates>("place/v3", { refid: refId });
    return place ? { lat: place.lat, lng: place.lng } : null;
  },

  reverse: async (lat: number, lng: number) => {
    const results = (await get<SearchResult[]>("reverse/v3", { lat, lng })) ?? [];
    const best = results.find((result) => boundary(result, 2)) ?? results[0];
    if (!best) return null;
    return { ...toPlace(best), name: toPlace(results.find((result) => result.name?.trim()) ?? best).name };
  },

  locate: async (text: string) => {
    const known = located.get(text);
    if (known) return known;

    const results = await get<SearchResult[]>("search/v3", { text });
    const position = results?.[0] ? await vietmapApi.coordinates(results[0].ref_id) : null;
    if (position) located.set(text, position);
    return position;
  },
};
