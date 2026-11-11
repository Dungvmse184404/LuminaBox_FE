import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthContext";
import { useUpdateProfile } from "@/features/auth/hooks/useLogin";
import { PHONE_PATTERN } from "@/features/auth/validation";
import { errorMessage } from "@/lib/errors";
import { DefaultAddressSection } from "./DefaultAddressSection";

const ROLE_LABEL = { User: "Khách hàng", Organization: "Chủ cửa hàng", Manager: "Quản lý" } as const;

const schema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên").max(100, "Họ tên tối đa 100 ký tự"),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || PHONE_PATTERN.test(value), "Số điện thoại không hợp lệ (ví dụ 0912345678)"),
});

type FormValues = z.infer<typeof schema>;

export function PersonalInfoForm() {
  const { user } = useAuth();
  const toast = useToast();
  const save = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) reset({ fullName: user.fullName, phone: user.phone ?? "" });
  }, [user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ fullName: values.fullName, phone: values.phone || null, address: user?.address ?? null });
      toast.success("Đã cập nhật thông tin cá nhân.");
    } catch (error) {
      toast.error(errorMessage(error, "Không cập nhật được thông tin."));
    }
  });

  if (!user) return null;

  return (
    <Card>
      <h2 className="mb-1 font-semibold text-ink">Thông tin cá nhân</h2>
      <p className="mb-4 text-sm text-ink-muted">
        {user.email} · {ROLE_LABEL[user.role]}
        {user.isEmailVerified === false && " · Email chưa xác thực"}
        {user.createdAt && ` · Tham gia ${new Date(user.createdAt).toLocaleDateString("vi-VN")}`}
      </p>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
        <Input label="Họ tên" required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Số điện thoại" type="tel" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
        <div className="sm:col-span-2">
          <Button type="submit" loading={save.isPending} disabled={!isDirty}>
            Lưu thông tin
          </Button>
        </div>
      </form>
      <DefaultAddressSection />
    </Card>
  );
}
