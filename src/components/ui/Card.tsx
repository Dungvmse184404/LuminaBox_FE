import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  flush?: boolean;
}

export function Card({ className, flush = false, ...rest }: Props) {
  return <div className={cn("rounded-card border border-line bg-card", !flush && "p-5", className)} {...rest} />;
}
