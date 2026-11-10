import { Link } from "react-router-dom";
import { StorageImage } from "@/components/ui/StorageImage";
import { useProducts } from "@/features/products/hooks/useProducts";
import { formatPrice } from "@/features/products/types";
import type { Stall } from "../types";

const LIMIT = 8;

export function StallProducts({ stall }: { stall: Stall }) {
  const { data, isLoading, isError } = useProducts({ stallId: stall.id, page: 1, pageSize: LIMIT });
  const items = data?.items ?? [];
  const shops = [...new Set(items.map((item) => item.organizerBrandName))];

  return (
    <div className="mt-3 grid gap-2.5 border-t border-line pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">Bánh đang bán tại quầy</h3>
        {data && data.totalCount > 0 && <span className="text-xs text-ink-muted">{data.totalCount} sản phẩm</span>}
      </div>
      {shops.length > 0 && <p className="text-xs text-ink-soft">Của {shops.join(", ")}</p>}

      {isLoading && <p className="text-sm text-ink-muted">Đang tải...</p>}
      {isError && <p className="text-sm text-danger">Không tải được danh sách bánh.</p>}
      {!isLoading && !isError && items.length === 0 && <p className="text-sm text-ink-muted">Quầy chưa có bánh còn hàng.</p>}

      {items.map((item) => (
        <Link
          key={item.id}
          to={`/products/${item.id}`}
          className="flex min-w-0 items-center gap-3 rounded-lg border border-line bg-card/70 p-2 transition hover:border-primary"
        >
          <StorageImage src={item.thumbnailUrl} alt={item.name} className="size-12 shrink-0 rounded-md object-cover" />
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 break-words text-sm font-medium text-ink">{item.name}</span>
            <span className="block truncate text-xs text-ink-muted">{item.organizerBrandName}</span>
          </span>
          {item.minPrice !== null && <span className="shrink-0 text-sm font-semibold text-primary">{formatPrice(item.minPrice)}</span>}
        </Link>
      ))}

      {data && data.totalCount > LIMIT && (
        <Link
          to={`/products?stallId=${stall.id}&stall=${encodeURIComponent(stall.name)}`}
          className="text-center text-sm font-semibold text-primary hover:underline"
        >
          Xem tất cả bánh tại quầy
        </Link>
      )}
    </div>
  );
}
