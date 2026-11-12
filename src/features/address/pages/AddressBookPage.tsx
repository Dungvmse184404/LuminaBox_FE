import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/errors";
import { AddressFormModal } from "../components/AddressFormModal";
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from "../hooks/useAddresses";
import { fullAddress, type Address, type AddressType } from "../types";

const COPY: Record<AddressType, { title: string; description: string; empty: string }> = {
  Shipping: {
    title: "Sổ địa chỉ",
    description: "Địa chỉ nhận hàng dùng để tính phí giao hàng và đặt đơn.",
    empty: "Thêm địa chỉ nhận hàng đầu tiên để xem phí giao hàng.",
  },
  Pickup: {
    title: "Địa chỉ lấy hàng",
    description: "Điểm lấy hàng cho các đơn bán online không gắn gian hàng.",
    empty: "Thêm địa chỉ lấy hàng để nhận đơn online.",
  },
};

export function AddressBookPage({ type = "Shipping" }: { type?: AddressType }) {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useAddresses(type);
  const setDefault = useSetDefaultAddress();
  const remove = useDeleteAddress();
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const copy = COPY[type];

  const makeDefault = async (address: Address) => {
    try {
      await setDefault.mutateAsync(address.id);
      toast.success("Đã đặt làm mặc định.");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể đặt mặc định."));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Đã xóa địa chỉ.");
      setDeleting(null);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể xóa địa chỉ."));
    }
  };

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Button onClick={() => setCreating(true)} data-guide={type === "Pickup" ? "pickup-address-add" : "address-book-add"}>
            <Plus size={16} />
            Thêm địa chỉ
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorState message="Không tải được địa chỉ." onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Chưa có địa chỉ" description={copy.empty} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((address) => (
            <Card key={address.id} className="flex min-w-0 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-medium text-ink">{address.contactName}</p>
                  <p className="text-sm text-ink-muted">{address.phone}</p>
                </div>
                {address.isDefault && <StatusBadge status="Active" label="Mặc định" />}
              </div>
              <p className="flex items-start gap-2 break-words text-sm text-ink-soft">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span className="min-w-0">{fullAddress(address)}</span>
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(address)}>
                  <Pencil size={14} />
                  Sửa
                </Button>
                {!address.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => makeDefault(address)}>
                    <Star size={14} />
                    Đặt mặc định
                  </Button>
                )}
                <Button variant="ghost" size="sm" data-guide-kind="danger" onClick={() => setDeleting(address)}>
                  <Trash2 size={14} />
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddressFormModal
        open={creating || editing !== null}
        type={type}
        address={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <Modal
        open={deleting !== null}
        title="Xóa địa chỉ"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Hủy
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={confirmDelete}>
              Xóa
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">{deleting && `Xóa địa chỉ "${fullAddress(deleting)}"?`}</p>
      </Modal>
    </>
  );
}
