import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StorageImage } from "@/components/ui/StorageImage";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthContext";
import { useAddBoxToCart } from "@/features/cart/hooks/useCart";
import { errorMessage } from "@/lib/errors";
import { useBoxes } from "../hooks/useProducts";
import { formatPrice, type BoxItem } from "../types";

const ONLINE = "online";

function BoxCard({ box }: { box: BoxItem }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const addBox = useAddBoxToCart();
  const sellable = box.stocks.filter((stock) => stock.isActive && stock.stockQuantity > 0);
  const [source, setSource] = useState("");
  const stock = sellable.find((s) => (s.stallId ?? ONLINE) === source) ?? sellable[0];

  const add = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    try {
      await addBox.mutateAsync({ boxItemId: box.id, quantity: 1, stallId: stock?.stallId ?? null });
      toast.success("Đã thêm vào giỏ hàng.");
    } catch (error) {
      toast.error(errorMessage(error, "Không thêm được vào giỏ hàng."));
    }
  };

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-card">
      <StorageImage src={box.images[0]?.url} alt={box.name} className="aspect-[4/3] w-full object-cover" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h2 className="line-clamp-2 break-words text-sm font-semibold text-ink">{box.name}</h2>
        <p className="truncate text-xs text-ink-muted">
          {box.organizerBrandName} · {box.capacity} bánh
        </p>
        <p className="font-bold text-primary">{formatPrice(box.price)}</p>
        {sellable.length > 1 && (
          <Select aria-label="Mua tại" value={stock?.stallId ?? ONLINE} onChange={(event) => setSource(event.target.value)}>
            {sellable.map((s) => (
              <option key={s.id} value={s.stallId ?? ONLINE}>
                {s.stallName ?? "Kho online"}
              </option>
            ))}
          </Select>
        )}
        <Button className="mt-auto" size="sm" disabled={sellable.length === 0} loading={addBox.isPending} onClick={add}>
          <ShoppingCart size={14} />
          {sellable.length === 0 ? "Tạm hết hàng" : "Thêm vào giỏ"}
        </Button>
      </div>
    </div>
  );
}

export function CakeSetsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useBoxes({ page, pageSize: 12 });

  return (
    <>
      <PageHeader title="Bánh & hộp Trung thu" />
      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorState message="Không tải được hộp bánh." onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Chưa có hộp bánh" />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {data.items.map((box) => (
            <BoxCard key={box.id} box={box} />
          ))}
        </div>
      )}
      {data && <Pager page={data} onChange={setPage} />}
    </>
  );
}
