import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { catalogError } from "../catalogErrors";
import { useSaveProduct } from "../hooks/useMyCatalog";
import type { MyProduct } from "../types";

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên sản phẩm").max(200, "Tối đa 200 ký tự"),
  description: z.string().max(2000, "Tối đa 2000 ký tự").optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  product: MyProduct | null;
  onClose: () => void;
  onCreated?: (product: MyProduct) => void;
}

export function ProductFormModal({ open, product, onClose, onCreated }: Props) {
  const toast = useToast();
  const save = useSaveProduct();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ name: product?.name ?? "", description: product?.description ?? "" });
  }, [open, product, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({ id: product?.id, payload: { name: values.name.trim(), description: values.description?.trim() || undefined } });
      toast.success(product ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm ở trạng thái nháp.");
      onClose();
      if (!product) onCreated?.(saved);
    } catch (error) {
      toast.error(catalogError(error, "Không lưu được sản phẩm."));
    }
  });

  return (
    <Modal
      open={open}
      title={product ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={save.isPending} onClick={onSubmit}>
            Lưu
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Tên sản phẩm" required error={errors.name?.message} {...register("name")} />
        <Textarea label="Mô tả" rows={4} error={errors.description?.message} {...register("description")} />
      </form>
    </Modal>
  );
}
