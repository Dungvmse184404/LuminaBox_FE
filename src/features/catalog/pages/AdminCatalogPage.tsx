import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pager } from "@/components/ui/Pager";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { LookupFormModal } from "../components/LookupFormModal";
import { useDeleteLookup, useLookups } from "../hooks/useCategories";
import { LOOKUP_LABEL, type Lookup, type LookupKind } from "../types";

const TABS: [LookupKind, string][] = [
  ["category", "Loại bánh"],
  ["filling", "Nhân"],
];
const SUGGESTION_QUERY = { pageSize: 50, sortBy: "name", isDescending: false };

export function AdminCatalogPage() {
  const [params, setParams] = useSearchParams();
  const kind: LookupKind = params.get("tab") === "fillings" ? "filling" : "category";
  const label = LOOKUP_LABEL[kind];

  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Lookup | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Lookup | null>(null);

  const { data, isLoading, isError, refetch } = useLookups(kind, { search, page, pageSize: 10, sortBy: "name", isDescending: false });
  const suggestions = useLookups(kind, SUGGESTION_QUERY);
  const remove = useDeleteLookup(kind);

  const switchTab = (next: LookupKind) => {
    setSearch("");
    setPage(1);
    setParams(next === "filling" ? { tab: "fillings" } : {}, { replace: true });
  };

  const openForm = (item: Lookup | null) => {
    setEditing(item);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(`Đã xóa ${label} "${deleting.name}".`);
      setDeleting(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) toast.error(`Không xóa được: đang có sản phẩm dùng ${label} này.`);
      else toast.error(e instanceof ApiError ? e.message : `Không xóa được ${label}.`);
    }
  };

  return (
    <>
      <PageHeader
        title="Loại bánh & nhân"
        description="Danh mục nền để Organizer chọn khi tạo biến thể sản phẩm."
        actions={
          <Button onClick={() => openForm(null)} data-guide={`catalog-add-${kind}`}>
            <Plus size={16} />
            Thêm {label}
          </Button>
        }
      />

      <div className="mb-4 flex border-b border-line" role="tablist">
        {TABS.map(([key, text]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={kind === key}
            onClick={() => switchTab(key)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm font-semibold transition",
              kind === key ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {text}
          </button>
        ))}
      </div>

      <div className="mb-4 max-w-sm">
        <SearchInput
          key={kind}
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={`Tìm ${label}...`}
          suggestions={suggestions.data?.items.map(({ id, name }) => ({ id, name }))}
        />
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorState message="Không tải được danh sách." onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={`Chưa có ${label}`} description={`Thử đổi từ khóa tìm kiếm hoặc thêm ${label} mới.`} />
      ) : (
        <Card flush className="divide-y divide-line">
          {data.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{item.name}</p>
                {item.description && <p className="break-words text-sm text-ink-muted">{item.description}</p>}
              </div>
              <Button size="sm" variant="ghost" aria-label={`Sửa ${item.name}`} title="Sửa" onClick={() => openForm(item)}>
                <Pencil size={14} />
              </Button>
              <Button size="sm" variant="ghost" aria-label={`Xóa ${item.name}`} title="Xóa" className="hover:text-danger" data-guide-kind="danger" onClick={() => setDeleting(item)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </Card>
      )}

      {data && <Pager page={data} onChange={setPage} />}

      <LookupFormModal kind={kind} open={formOpen} item={editing} onClose={() => setFormOpen(false)} />
      <ConfirmModal
        open={deleting !== null}
        title={`Xóa ${label}`}
        confirmLabel="Xóa"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      >
        Xóa {label} <span className="font-semibold text-ink">{deleting?.name}</span>? Chỉ xóa được khi chưa có sản phẩm nào dùng.
      </ConfirmModal>
    </>
  );
}
