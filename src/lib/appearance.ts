import { useSyncExternalStore } from "react";

const EFFECTS_KEY = "luminabox.effects";

export type CloudMode = "playing" | "paused" | "hidden";
export type RailSurface = "blur" | "tint";
export type FluidRail = "full" | "clip" | "stitch";

export interface EffectSettings {
  fluidFps: number;
  fluidDrift: number;
  fluidRail: FluidRail;
  cloudMode: CloudMode;
  railSurface: RailSurface;
}

export const FLUID_DRIFT_MAX = 5;

export const FPS_STEPS = [0, 15, 20, 30, 60] as const;

export type EffectPreset = "full" | "reduced";

export const EFFECT_PRESETS: Record<EffectPreset, EffectSettings> = {
  full: { fluidFps: 30, fluidDrift: 3, fluidRail: "clip", cloudMode: "playing", railSurface: "blur" },
  reduced: { fluidFps: 0, fluidDrift: 3, fluidRail: "clip", cloudMode: "playing", railSurface: "blur" },
};

export const EFFECT_PRESET_LABELS: ReadonlyArray<{ value: EffectPreset; label: string }> = [
  { value: "full", label: "Đầy đủ" },
  { value: "reduced", label: "Rút gọn" },
];

const DEFAULTS = EFFECT_PRESETS.full;

function clampInt(value: unknown, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

function readEffects(): EffectSettings {
  let parsed: unknown;
  try {
    const raw = localStorage.getItem(EFFECTS_KEY);
    if (raw === null) return DEFAULTS;
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULTS;
  }
  if (typeof parsed !== "object" || parsed === null) return DEFAULTS;

  const v = parsed as Record<string, unknown>;
  return {
    fluidFps: clampInt(v.fluidFps, 60) ?? DEFAULTS.fluidFps,
    fluidDrift: clampInt(v.fluidDrift, FLUID_DRIFT_MAX) ?? DEFAULTS.fluidDrift,
    fluidRail: v.fluidRail === "full" || v.fluidRail === "clip" || v.fluidRail === "stitch" ? v.fluidRail : DEFAULTS.fluidRail,
    cloudMode: v.cloudMode === "playing" || v.cloudMode === "paused" || v.cloudMode === "hidden" ? v.cloudMode : DEFAULTS.cloudMode,
    railSurface: v.railSurface === "blur" || v.railSurface === "tint" ? v.railSurface : DEFAULTS.railSurface,
  };
}

let effects = readEffects();
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getEffects() {
  return effects;
}

export function setEffects(patch: Partial<EffectSettings>) {
  effects = { ...effects, ...patch };
  try {
    localStorage.setItem(EFFECTS_KEY, JSON.stringify(effects));
  } catch {
    listeners.forEach((l) => l());
    return;
  }
  listeners.forEach((l) => l());
}

export function applyEffectPreset(preset: EffectPreset) {
  setEffects(EFFECT_PRESETS[preset]);
}

export function getActivePreset(current: EffectSettings): EffectPreset | null {
  const keys = Object.keys(DEFAULTS) as Array<keyof EffectSettings>;
  for (const [name, preset] of Object.entries(EFFECT_PRESETS)) {
    if (keys.every((k) => current[k] === preset[k])) return name as EffectPreset;
  }
  return null;
}

export function useEffectSettings() {
  return useSyncExternalStore(subscribe, getEffects);
}
