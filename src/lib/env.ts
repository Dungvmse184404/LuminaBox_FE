const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const env = {
  apiBase: str(import.meta.env.VITE_API_BASE_URL) || "http://localhost:5187/api",
  useMock: str(import.meta.env.VITE_USE_MOCK) === "true",
  supabaseUrl: str(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, ""),
  bucket: str(import.meta.env.VITE_SUPABASE_BUCKET) || "images",
  vietmapKey: str(import.meta.env.VITE_VIETMAP_API_KEY),
  vietmapTilemapKey: str(import.meta.env.VITE_VIETMAP_TILEMAP_KEY),
};
