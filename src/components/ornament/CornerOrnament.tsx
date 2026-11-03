import { cn } from "@/lib/cn";

export type Corner = "tl" | "tr" | "bl" | "br";

const FLIP: Record<Corner, string> = {
  tl: "left-2 top-2",
  tr: "right-2 top-2 -scale-x-100",
  bl: "bottom-2 left-2 -scale-y-100",
  br: "bottom-2 right-2 -scale-100",
};

const FADE = "[mask-image:radial-gradient(ellipse_100%_100%_at_0_0,#000_58%,transparent_100%)]";

export function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter" aria-hidden className={cn(FADE, className)}>
      <path d="M120 2H26V62H14V50H50V14H62V26H2V120" />
      <path d="M120 14H74V38H14V2H2V14H38V74H14V120" />
    </svg>
  );
}

interface FrameProps {
  corners?: Corner[];
  size?: "edge" | "card";
  className?: string;
}

export function CornerFrame({ corners = ["tl", "tr", "bl", "br"], size = "card", className }: FrameProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden text-gold", className)}>
      {corners.map((corner) => (
        <CornerOrnament key={corner} className={cn("absolute aspect-square", FLIP[corner], size === "edge" ? "w-(--lb-corner-size)" : "size-20")} />
      ))}
    </div>
  );
}
