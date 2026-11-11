import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { useSaveLookup } from "../hooks/useCategories";
import { LOOKUP_LABEL, type Lookup, type LookupKind } from "../types";

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(100, "Tối đa 100 ký tự"),
  description: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  kind: LookupKind;
  open: boolean;
  item: Lookup | null;
  onClose: () => void;
}

export function LookupFormModal({ kind, open, item, onClose }: Props) {
  const toast = useToast();
  const save = useSaveLookup(kind);
  const label = LOOKUP_LABEL[kind];
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ name: item?.name ?? "", description: item?.description ?? "" });
  }, [open, item, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = { name: values.name.trim(), description: values.description?.trim() || undefined };
    try {
      await save.mutateAsync({ id: item?.id, payload });
      toast.success(item ? `Đã cập nhật ${label}.` : `Đã thêm ${label}.`);
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) toast.error(`Tên ${label} này đã tồn tại.`);
      else toast.error(e instanceof ApiError ? e.message : `Không lưu được ${label}.`);
    }
  });

  return (
    <Modal
      open={open}
      title={item ? `Sửa ${label}` : `Thêm ${label}`}
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
        <Input label={kind === "category" ? "Tên loại bánh" : "Tên nhân"} required error={errors.name?.message} {...register("name")} />
        <Textarea label="Mô tả" rows={3} error={errors.description?.message} {...register("description")} />
      </form>
    </Modal>
  );
}
