import { useSearchParams } from "react-router-dom";
import { Pager } from "@/components/ui/Pager";
import { SearchInput } from "@/components/ui/SearchInput";
import { ErrorState, SkeletonRows } from "@/components/ui/States";
import { useCategories } from "@/features/catalog/hooks/useCategories";
import { ProductCard } from "../components/ProductCard";
import { useFillings, useProducts } from "../hooks/useProducts";

const CATEGORY_QUERY = { pageSize: 50, sortBy: "name", isDescending: false };

const chip = (active: boolean) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    active ? "border-primary bg-primary text-white" : "border-line bg-card text-ink-soft hover:border-primary hover:text-primary"
  }`;

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get("categoryId") ?? "";
  const fillingId = params.get("fillingId") ?? "";
  const search = params.get("q") ?? "";
  const page = Number(params.get("page") ?? 1) || 1;
  const organizerId = params.get("organizerId") ?? "";
  const brand = params.get("brand") ?? "";

  const categories = useCategories(CATEGORY_QUERY);
  const fillings = useFillings();
  const { data, isLoading, isError, refetch } = useProducts({
    search,
    page,
    pageSize: 12,
    categoryId: categoryId || undefined,
    fillingId: fillingId || undefined,
    organizerId: organizerId || undefined,
  });

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ page: "", ...changes })) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };

  return (
    <>
      <h1 className="font-serif text-2xl font-black text-primary-dark">{organizerId && brand ? `Sản phẩm của ${brand}` : "Sản phẩm"}</h1>
      {organizerId && (
        <button type="button" onClick={() => update({ organizerId: "", brand: "" })} className="mt-1 text-sm font-semibold text-primary hover:underline">
          Xem sản phẩm của mọi gian hàng
        </button>
      )}

      <SearchInput value={search} onChange={(q) => update({ q })} placeholder="Tìm theo tên bánh" className="mt-4 max-w-xl" />

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={chip(!categoryId)} aria-pressed={!categoryId} onClick={() => update({ categoryId: "" })}>
          Tất cả
        </button>
        {categories.data?.items.map((category) => (
          <button key={category.id} type="button" className={chip(categoryId === category.id)} aria-pressed={categoryId === category.id} onClick={() => update({ categoryId: category.id })}>
            {category.name}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={chip(!fillingId)} aria-pressed={!fillingId} onClick={() => update({ fillingId: "" })}>
          Mọi loại nhân
        </button>
        {fillings.data?.map((filling) => (
          <button key={filling.id} type="button" className={chip(fillingId === filling.id)} aria-pressed={fillingId === filling.id} onClick={() => update({ fillingId: filling.id })}>
            {filling.name}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <SkeletonRows />
        ) : isError ? (
          <ErrorState message="Không tải được sản phẩm." onRetry={() => refetch()} />
        ) : data?.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-sm text-ink-muted">Không tìm thấy sản phẩm phù hợp.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {data && <Pager page={data} onChange={(next) => update({ page: String(next) })} />}
      </div>
    </>
  );
}
