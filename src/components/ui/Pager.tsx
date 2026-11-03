import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Paged } from "@/types/api";

interface Props {
  page: Pick<Paged<unknown>, "pageIndex" | "totalPages" | "totalCount">;
  onChange: (page: number) => void;
}

export function Pager({ page, onChange }: Props) {
  if (page.totalPages <= 1) return null;

  const btn = "grid size-8 place-items-center rounded-lg border border-line bg-card text-ink-soft transition hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft";

  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm text-ink-soft">
      <span>
        Trang {page.pageIndex}/{page.totalPages} · {page.totalCount} mục
      </span>
      <div className="flex gap-1.5">
        <button type="button" className={btn} disabled={page.pageIndex <= 1} onClick={() => onChange(page.pageIndex - 1)} aria-label="Trang trước">
          <ChevronLeft size={16} />
        </button>
        <button type="button" className={btn} disabled={page.pageIndex >= page.totalPages} onClick={() => onChange(page.pageIndex + 1)} aria-label="Trang sau">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
