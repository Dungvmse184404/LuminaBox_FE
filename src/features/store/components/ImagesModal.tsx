import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StorageImage } from "@/components/ui/StorageImage";
import { useToast } from "@/components/ui/Toast";
import type { ProductImage } from "@/features/products/types";
import { ImageUploadButton } from "@/features/uploads/components/ImageUploadButton";
import type { CatalogKind } from "../api/catalogApi";
import { catalogError } from "../catalogErrors";
import { useAddImage, useRemoveImage } from "../hooks/useMyCatalog";

const MAX_IMAGES = 10;

interface Props {
  kind: CatalogKind;
  target: { id: string; name: string; images: ProductImage[] } | null;
  onClose: () => void;
}

export function ImagesModal({ kind, target, onClose }: Props) {
  const toast = useToast();
  const add = useAddImage(kind);
  const remove = useRemoveImage(kind);
  const images = target?.images ?? [];

  const attach = async (url: string) => {
    if (!target) return;
    try {
      await add.mutateAsync({ id: target.id, url });
      toast.success("Đã thêm ảnh.");
    } catch (error) {
      toast.error(catalogError(error, "Không thêm được ảnh."));
    }
  };

  const submitRemove = async (imageId: string) => {
    if (!target) return;
    try {
      await remove.mutateAsync({ id: target.id, imageId });
      toast.success("Đã xóa ảnh.");
    } catch (error) {
      toast.error(catalogError(error, "Không xóa được ảnh."));
    }
  };

  return (
    <Modal open={target !== null} title={`Ảnh · ${target?.name ?? ""}`} onClose={onClose}>
      <div className="grid gap-4">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="relative">
              <StorageImage src={image.url} alt="" className="aspect-square w-full rounded-lg" />
              <button
                type="button"
                aria-label="Xóa ảnh"
                disabled={images.length <= 1 || remove.isPending}
                onClick={() => submitRemove(image.id)}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-card/90 text-ink-soft shadow-card hover:text-danger disabled:opacity-40"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ImageUploadButton
            purpose={kind === "product-items" ? "ProductImage" : "BoxImage"}
            maxFiles={MAX_IMAGES - images.length}
            label="Thêm ảnh"
            onUploaded={attach}
            onError={toast.error}
          />
          <p className="text-xs text-ink-muted">
            {images.length}/{MAX_IMAGES} ảnh · JPG, PNG, WEBP tối đa 5 MB
          </p>
        </div>
      </div>
    </Modal>
  );
}
