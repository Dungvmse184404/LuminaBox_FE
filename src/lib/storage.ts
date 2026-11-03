import { env } from "@/lib/env";

// Read-only on purpose: uploads go through the BE (ADR-0015). Never upload from the browser with a Supabase key.
export function storageUrl(path: string): string | undefined {
  if (!env.supabaseUrl) return undefined;
  return `${env.supabaseUrl}/storage/v1/object/public/${env.bucket}/${path.replace(/^\//, "")}`;
}

export function imageSrc(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return /^https?:\/\//.test(value) ? value : storageUrl(value);
}
