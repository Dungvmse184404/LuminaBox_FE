import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useForgotPassword, useResetPassword } from "@/features/auth/hooks/useLogin";
import { otpSchema, passwordSchema } from "@/features/auth/validation";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

const emailSchema = z.object({ email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ") });

const resetSchema = z
  .object({ otpCode: otpSchema, newPassword: passwordSchema, confirmNewPassword: z.string() })
  .refine((values) => values.newPassword === values.confirmNewPassword, { path: ["confirmNewPassword"], message: "Mật khẩu xác nhận không khớp" });

type EmailValues = z.infer<typeof emailSchema>;
type ResetValues = z.infer<typeof resetSchema>;

function resetError(error: unknown) {
  if (error instanceof ApiError && error.status === 404) return "Không tìm thấy tài khoản với email này.";
  if (error instanceof ApiError && /incorrect/i.test(error.message)) return "Mã OTP không đúng.";
  if (error instanceof ApiError && /expired|invalid/i.test(error.message)) return "Mã OTP không hợp lệ hoặc đã hết hạn. Hãy gửi lại mã.";
  if (error instanceof ApiError && /maximum number of attempts/i.test(error.message)) return "Đã nhập sai quá số lần cho phép. Hãy gửi lại mã.";
  return errorMessage(error, "Không đặt lại được mật khẩu.");
}

export function ForgotPasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const forgot = useForgotPassword();
  const reset = useResetPassword();
  const [email, setEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: user?.email ?? "" } });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const sendCode = emailForm.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await forgot.mutateAsync(values.email);
      setEmail(values.email);
      toast.success("Đã gửi mã OTP tới email của bạn.");
    } catch (error) {
      setFormError(resetError(error));
    }
  });

  const resend = async () => {
    if (!email) return;
    try {
      await forgot.mutateAsync(email);
      toast.success("Đã gửi lại mã OTP.");
    } catch (error) {
      toast.error(resetError(error));
    }
  };

  const submitReset = resetForm.handleSubmit(async (values) => {
    if (!email) return;
    setFormError(null);
    try {
      await reset.mutateAsync({ email, ...values });
      if (user) logout();
      toast.success("Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.");
      navigate("/login", { replace: true });
    } catch (error) {
      setFormError(resetError(error));
    }
  });

  const footer = (
    <Link to={user ? "/account/profile" : "/login"} className="font-semibold text-primary hover:underline">
      {user ? "Quay lại hồ sơ" : "Quay lại đăng nhập"}
    </Link>
  );

  if (!email) {
    return (
      <AuthShell title="Quên mật khẩu" subtitle="Nhập email tài khoản để nhận mã OTP đặt lại mật khẩu." footer={footer}>
        <form onSubmit={sendCode} className="space-y-4" noValidate>
          <Input label="Email" type="email" autoComplete="email" required error={emailForm.formState.errors.email?.message} {...emailForm.register("email")} />
          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}
          <Button type="submit" loading={forgot.isPending} className="w-full">
            Gửi mã OTP
          </Button>
        </form>
      </AuthShell>
    );
  }

  const { errors } = resetForm.formState;
  return (
    <AuthShell title="Đặt lại mật khẩu" subtitle={`Nhập mã OTP đã gửi tới ${email} và mật khẩu mới.`} footer={footer}>
      <form onSubmit={submitReset} className="space-y-4" noValidate>
        <Input label="Mã OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required error={errors.otpCode?.message} {...resetForm.register("otpCode")} />
        <Input label="Mật khẩu mới" type="password" autoComplete="new-password" required error={errors.newPassword?.message} {...resetForm.register("newPassword")} />
        <Input
          label="Nhập lại mật khẩu mới"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmNewPassword?.message}
          {...resetForm.register("confirmNewPassword")}
        />
        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
        <Button type="submit" loading={reset.isPending} className="w-full">
          Đặt lại mật khẩu
        </Button>
        <div className="flex justify-between text-sm">
          <button type="button" className="font-semibold text-ink-soft hover:text-primary" onClick={() => setEmail(null)}>
            Đổi email
          </button>
          <button type="button" className="font-semibold text-primary hover:underline disabled:opacity-60" disabled={forgot.isPending} onClick={resend}>
            Gửi lại mã
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
