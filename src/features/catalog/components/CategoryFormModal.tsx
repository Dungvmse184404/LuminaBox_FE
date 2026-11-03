import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useCreateCategory } from "../hooks/useCategories";

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(100, "Tối đa 100 ký tự"),
  description: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CategoryFormModal({ open, onClose }: Props) {
  const toast = useToast();
  const create = useCreateCategory();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ name: "", description: "" });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      toast.success("Đã tạo loại bánh.");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Không thể tạo loại bánh.");
    }
  });

  return (
    <Modal
      open={open}
      title="Thêm loại bánh"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={create.isPending} onClick={onSubmit}>
            Lưu
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Tên loại bánh" required error={errors.name?.message} {...register("name")} />
        <Textarea label="Mô tả" rows={3} error={errors.description?.message} {...register("description")} />
      </form>
    </Modal>
  );
}
