import { setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { env } from "@/lib/env";

setWorkerUrl(workerUrl);

export function vietmapStyle(): StyleSpecification {
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
