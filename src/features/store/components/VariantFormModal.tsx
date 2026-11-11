import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useLookups } from "@/features/catalog/hooks/useCategories";
import { catalogError } from "../catalogErrors";
import { useSaveVariant } from "../hooks/useMyCatalog";
import type { MyVariant } from "../types";
import { ImagesField, positive, SizeFields, validateSize, type FieldErrors } from "./CatalogFields";

const LOOKUP_QUERY = { pageSize: 50, sortBy: "name", isDescending: false };

interface Fields {
  categoryId: string;
  fillingId: string;
  name: string;
  eggCount: string;
  weight: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  price: string;
}

const EMPTY: Fields = { categoryId: "", fillingId: "", name: "", eggCount: "0", weight: "", lengthCm: "", widthCm: "", heightCm: "", price: "" };

interface Props {
  open: boolean;
  productId: string | null;
  variant: MyVariant | null;
  onClose: () => void;
}

export function VariantFormModal({ open, productId, variant, onClose }: Props) {
  const toast = useToast();
  const save = useSaveVariant();
  const categories = useLookups("category", LOOKUP_QUERY);
  const fillings = useLookups("filling", LOOKUP_QUERY);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors<keyof Fields | "images"> | null>(null);

  useEffect(() => {
    if (!open) return;
    setFields(
      variant
        ? {
            categoryId: variant.categoryId,
            fillingId: variant.fillingId,
            name: variant.name,
            eggCount: String(variant.eggCount),
            weight: String(variant.weight),
            lengthCm: String(variant.lengthCm),
            widthCm: String(variant.widthCm),
            heightCm: String(variant.heightCm),
            price: String(variant.price),
          }
        : EMPTY,
    );
    setImages([]);
    setErrors(null);
  }, [open, variant]);

  const set = (key: keyof Fields, value: string) => setFields((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const next: FieldErrors<keyof Fields | "images"> = { ...validateSize(fields) };
    if (!fields.categoryId) next.categoryId = "Chọn loại bánh";
    if (!fields.fillingId) next.fillingId = "Chọn nhân";
    if (fields.eggCount === "" || !Number.isInteger(Number(fields.eggCount)) || Number(fields.eggCount) < 0) next.eggCount = "Số nguyên từ 0";
    if (!positive(fields.price)) next.price = "Giá phải lớn hơn 0";
    if (fields.name.length > 200) next.name = "Tối đa 200 ký tự";
    if (!variant && images.length === 0) next.images = "Cần ít nhất một ảnh";
    setErrors(Object.keys(next).length > 0 ? next : null);
    if (Object.keys(next).length > 0 || !productId) return;

    try {
      await save.mutateAsync({
        productId,
        id: variant?.id,
        payload: {
          categoryId: fields.categoryId,
          fillingId: fields.fillingId,
          name: fields.name.trim() || undefined,
          eggCount: Number(fields.eggCount),
          weight: Number(fields.weight),
          lengthCm: Number(fields.lengthCm),
          widthCm: Number(fields.widthCm),
          heightCm: Number(fields.heightCm),
          price: Number(fields.price),
          imageUrls: variant ? undefined : images,
        },
      });
      toast.success(variant ? "Đã cập nhật biến thể." : "Đã thêm biến thể.");
      onClose();
    } catch (error) {
      toast.error(catalogError(error, "Không lưu được biến thể."));
    }
  };

  return (
    <Modal
      open={open}
      title={variant ? "Sửa biến thể" : "Thêm biến thể"}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            Lưu
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-3"
        noValidate
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Loại bánh" required value={fields.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors?.categoryId}>
            <option value="">Chọn loại bánh</option>
            {categories.data?.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select label="Nhân" required value={fields.fillingId} onChange={(e) => set("fillingId", e.target.value)} error={errors?.fillingId}>
            <option value="">Chọn nhân</option>
            {fillings.data?.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Tên hiển thị" placeholder="Để trống để hệ thống tự đặt" value={fields.name} onChange={(e) => set("name", e.target.value)} error={errors?.name} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Số trứng" required type="number" min={0} value={fields.eggCount} onChange={(e) => set("eggCount", e.target.value)} error={errors?.eggCount} />
          <Input label="Giá (₫)" required type="number" min={1} value={fields.price} onChange={(e) => set("price", e.target.value)} error={errors?.price} />
        </div>
        <SizeFields values={fields} errors={errors} onChange={set} />
        {!variant && <ImagesField purpose="ProductImage" value={images} error={errors?.images} onChange={setImages} />}
      </form>
    </Modal>
  );
}
