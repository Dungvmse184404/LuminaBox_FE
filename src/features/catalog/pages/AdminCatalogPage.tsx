import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pager } from "@/components/ui/Pager";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { CategoryFormModal } from "../components/CategoryFormModal";
import { useCategories } from "../hooks/useCategories";

export function AdminCatalogPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError, refetch } = useCategories({ search, page, pageSize: 5, sortBy: "name", isDescending: false });

  return (
    <>
      <PageHeader
        title="Loại bánh & nhân"
        description="Danh mục nền để Organizer chọn khi tạo biến thể sản phẩm."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} />
            Thêm loại bánh
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Tìm loại bánh..."
        />
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorState message="Không tải được danh sách." onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Chưa có loại bánh" description="Thử đổi từ khóa tìm kiếm hoặc thêm loại bánh mới." />
      ) : (
        <Card className="divide-y divide-line p-0">
          {data.items.map((category) => (
            <div key={category.id} className="px-5 py-3.5">
              <p className="font-medium text-ink">{category.name}</p>
              {category.description && <p className="text-sm text-ink-muted">{category.description}</p>}
            </div>
          ))}
        </Card>
      )}

      {data && <Pager page={data} onChange={setPage} />}
      <CategoryFormModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
