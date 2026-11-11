import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { catalogError } from "../catalogErrors";
import { useSaveBox } from "../hooks/useMyCatalog";
import type { MyBox } from "../types";
import { ImagesField, positive, SizeFields, validateSize, type FieldErrors } from "./CatalogFields";

interface Fields {
  name: string;
  description: string;
  capacity: string;
  weight: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  price: string;
}

const EMPTY: Fields = { name: "", description: "", capacity: "", weight: "", lengthCm: "", widthCm: "", heightCm: "", price: "" };

interface Props {
  open: boolean;
  box: MyBox | null;
  onClose: () => void;
}

export function BoxFormModal({ open, box, onClose }: Props) {
  const toast = useToast();
  const save = useSaveBox();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors<keyof Fields | "images"> | null>(null);

  useEffect(() => {
    if (!open) return;
    setFields(
      box
        ? {
            name: box.name,
            description: box.description ?? "",
            capacity: String(box.capacity),
            weight: String(box.weight),
            lengthCm: String(box.lengthCm),
            widthCm: String(box.widthCm),
            heightCm: String(box.heightCm),
            price: String(box.price),
          }
        : EMPTY,
    );
    setImages([]);
    setErrors(null);
  }, [open, box]);

  const set = (key: keyof Fields, value: string) => setFields((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const next: FieldErrors<keyof Fields | "images"> = { ...validateSize(fields) };
    if (!fields.name.trim()) next.name = "Vui lòng nhập tên hộp";
    else if (fields.name.trim().length > 200) next.name = "Tối đa 200 ký tự";
    if (fields.description.length > 2000) next.description = "Tối đa 2000 ký tự";
    if (!positive(fields.capacity) || !Number.isInteger(Number(fields.capacity))) next.capacity = "Số nguyên lớn hơn 0";
    if (!positive(fields.price)) next.price = "Giá phải lớn hơn 0";
    if (!box && images.length === 0) next.images = "Cần ít nhất một ảnh";
    setErrors(Object.keys(next).length > 0 ? next : null);
    if (Object.keys(next).length > 0) return;

    try {
      await save.mutateAsync({
        id: box?.id,
        payload: {
          name: fields.name.trim(),
          description: fields.description.trim() || undefined,
          capacity: Number(fields.capacity),
          weight: Number(fields.weight),
          lengthCm: Number(fields.lengthCm),
          widthCm: Number(fields.widthCm),
          heightCm: Number(fields.heightCm),
          price: Number(fields.price),
          imageUrls: box ? undefined : images,
        },
      });
      toast.success(box ? "Đã cập nhật hộp." : "Đã tạo hộp ở trạng thái nháp.");
      onClose();
    } catch (error) {
      toast.error(catalogError(error, "Không lưu được hộp."));
    }
  };

  return (
    <Modal
      open={open}
      title={box ? "Sửa hộp" : "Thêm hộp"}
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
        <Input label="Tên hộp" required value={fields.name} onChange={(e) => set("name", e.target.value)} error={errors?.name} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Sức chứa (bánh)" required type="number" min={1} value={fields.capacity} onChange={(e) => set("capacity", e.target.value)} error={errors?.capacity} />
          <Input label="Giá hộp (₫)" required type="number" min={1} value={fields.price} onChange={(e) => set("price", e.target.value)} error={errors?.price} />
        </div>
        <SizeFields values={fields} errors={errors} onChange={set} />
        <Textarea label="Mô tả" rows={3} value={fields.description} onChange={(e) => set("description", e.target.value)} error={errors?.description} />
        {!box && <ImagesField purpose="BoxImage" value={images} error={errors?.images} onChange={setImages} />}
      </form>
    </Modal>
  );
}
