import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  EFFECT_PRESET_LABELS,
  GUIDE_COUNTDOWN_STEPS,
  applyEffectPreset,
  getActivePreset,
  setEffects,
  useEffectSettings,
} from "@/lib/appearance";
import { cn } from "@/lib/cn";

const choiceClass = "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors";

export function EffectSettingsMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const settings = useEffectSettings();
  const preset = getActivePreset(settings);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Cài đặt hiệu ứng"
        className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-primary-soft transition hover:text-white"
      >
        <Sparkles size={20} />
        <span className="hidden text-[11px] sm:block">Hiệu ứng</span>
      </button>

      {open && (
        <div role="dialog" aria-label="Cài đặt hiệu ứng" className="lb-fade-in absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-card p-3 text-ink shadow-pop">
          <p className="mb-1.5 text-sm font-medium text-ink-soft">Hiệu ứng nền</p>
          <div role="radiogroup" aria-label="Mức hiệu ứng nền" className={cn("flex gap-1 rounded-lg bg-cream p-1", preset === null && "ring-2 ring-primary")}>
            {EFFECT_PRESET_LABELS.map((choice) => {
              const selected = preset === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => applyEffectPreset(choice.value)}
                  className={cn(choiceClass, selected ? "bg-primary text-white" : "text-ink-soft hover:bg-cream-dark hover:text-ink")}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>

          <p className="mb-1.5 mt-3 text-sm font-medium text-ink-soft">Hướng dẫn tự chuyển bước</p>
          <div role="radiogroup" aria-label="Thời gian chờ trước khi hướng dẫn tự chuyển bước" className="flex gap-1 rounded-lg bg-cream p-1">
            {GUIDE_COUNTDOWN_STEPS.map((seconds) => {
              const selected = settings.guideCountdown === seconds;
              return (
                <button
                  key={seconds}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-guide-label={seconds === 0 ? "Tắt tự chuyển bước" : `Tự chuyển bước sau ${seconds} giây`}
                  onClick={() => setEffects({ guideCountdown: seconds })}
                  className={cn(choiceClass, selected ? "bg-primary text-white" : "text-ink-soft hover:bg-cream-dark hover:text-ink")}
                >
                  {seconds === 0 ? "Tắt" : `${seconds}s`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
