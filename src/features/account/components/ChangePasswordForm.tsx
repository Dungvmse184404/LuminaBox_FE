import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { useChangePassword } from "@/features/auth/hooks/useLogin";
import { passwordSchema } from "@/features/auth/validation";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, { path: ["confirmNewPassword"], message: "Mật khẩu xác nhận không khớp" })
  .refine((values) => values.newPassword !== values.currentPassword, { path: ["newPassword"], message: "Mật khẩu mới phải khác mật khẩu hiện tại" });

type FormValues = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await change.mutateAsync(values);
      reset();
      setOpen(false);
      toast.success("Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.");
    } catch (error) {
      if (error instanceof ApiError && error.code === "E1.6") setError("currentPassword", { message: "Mật khẩu hiện tại không đúng" });
      else toast.error(errorMessage(error, "Không đổi được mật khẩu."));
    }
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Mật khẩu</h2>
          <p className="text-sm text-ink-muted">Đổi mật khẩu sẽ đăng xuất tài khoản trên các thiết bị khác.</p>
        </div>
        {!open && (
          <Button variant="outline" onClick={() => setOpen(true)}>
            <KeyRound size={16} /> Đổi mật khẩu
          </Button>
        )}
      </div>
      {open && (
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2" noValidate>
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            required
            autoComplete="current-password"
            className="sm:col-span-2"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <Input label="Mật khẩu mới" type="password" required autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
          <Input
            label="Nhập lại mật khẩu mới"
            type="password"
            required
            autoComplete="new-password"
            error={errors.confirmNewPassword?.message}
            {...register("confirmNewPassword")}
          />
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <Button type="submit" loading={change.isPending}>
              Lưu mật khẩu mới
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Hủy
            </Button>
            <Link to="/forgot-password" className="ml-auto text-sm font-semibold text-primary hover:underline">
              Quên mật khẩu hiện tại?
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
}
