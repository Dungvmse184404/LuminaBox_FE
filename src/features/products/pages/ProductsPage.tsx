import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StorageImage } from "@/components/ui/StorageImage";
import { useCategories } from "@/features/catalog/hooks/useCategories";
import { useFillings, useProducts } from "../hooks/useProducts";
import { formatPrice } from "../types";

const CATEGORY_QUERY = { pageSize: 50, sortBy: "name", isDescending: false };
const SORTS = [
  { value: "createdAt:true", label: "Mới nhất" },
  { value: "price:false", label: "Giá tăng dần" },
  { value: "price:true", label: "Giá giảm dần" },
  { value: "name:false", label: "Tên A–Z" },
];

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fillingId, setFillingId] = useState("");
  const [sort, setSort] = useState(SORTS[0].value);
  const [page, setPage] = useState(1);

  const categories = useCategories(CATEGORY_QUERY);
  const fillings = useFillings();
  const [sortBy, isDescending] = sort.split(":");
  const { data, isLoading, isError, refetch } = useProducts({
    search,
    page,
    pageSize: 12,
    sortBy,
    isDescending: isDescending === "true",
    categoryId: categoryId || undefined,
    fillingId: fillingId || undefined,
  });

  return (
    <>
      <PageHeader title="Sản phẩm" description="Bánh Trung thu từ các gian hàng trên LuminaBox." />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Tìm sản phẩm..."
        />
        <Select
          aria-label="Loại bánh"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả loại bánh</option>
          {categories.data?.items.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Loại nhân"
          value={fillingId}
          onChange={(event) => {
            setFillingId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả loại nhân</option>
          {fillings.data?.map((filling) => (
            <option key={filling.id} value={filling.id}>
              {filling.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Sắp xếp"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorState message="Không tải được sản phẩm." onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Không có sản phẩm phù hợp" description="Thử đổi từ khóa hoặc bộ lọc." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="group min-w-0">
              <Card className="flex h-full flex-col gap-2 overflow-hidden p-0 transition group-hover:border-primary">
                <StorageImage src={product.thumbnailUrl} alt={product.name} className="aspect-[4/3] w-full object-cover" />
                <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 pt-2">
                  <p className="line-clamp-2 break-words font-serif font-bold text-ink">{product.name}</p>
                  <p className="truncate text-xs text-ink-muted">{product.organizerBrandName}</p>
                  <p className="mt-auto pt-1 text-sm font-semibold text-primary-dark">
                    {product.minPrice === null ? "Liên hệ" : `Từ ${formatPrice(product.minPrice)}`}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data && <Pager page={data} onChange={setPage} />}
    </>
  );
}
