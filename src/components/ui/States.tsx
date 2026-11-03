import type { ReactNode } from "react";
import { Inbox, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("lb-skeleton rounded-lg", className)} />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-card border border-dashed border-line bg-card/50 px-6 py-12 text-center">
      <Inbox size={28} className="text-ink-muted" />
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="grid place-items-center gap-2 rounded-card border border-danger/30 bg-danger/5 px-6 py-10 text-center">
      <TriangleAlert size={28} className="text-danger" />
      <p className="text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-sm font-semibold text-primary hover:underline">
          Thử lại
        </button>
      )}
    </div>
  );
}
