import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-primary hover:bg-primary-dark",
  outline: "border border-line bg-card text-ink-soft hover:border-primary hover:text-primary",
  ghost: "text-ink-soft hover:bg-cream-dark",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function Button({ variant = "primary", size = "md", loading, disabled, className, children, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 size={size === "sm" ? 12 : 16} className="animate-spin" />}
      {children}
    </button>
  );
}
