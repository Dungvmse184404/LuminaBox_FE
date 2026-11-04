import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useLogin, useResendOtp, useVerifyOtp } from "../hooks/useLogin";
import type { Credentials } from "../types";

const schema = z.object({
  otpCode: z.string().trim().regex(/^\d{6}$/, "Mã OTP gồm 6 chữ số"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  credentials: Credentials;
  onBack: () => void;
}

export function VerifyOtpForm({ credentials, onBack }: Props) {
  const toast = useToast();
  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const login = useLogin();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ otpCode }) => {
    setFormError("");
    try {
      await verify.mutateAsync({ email: credentials.email, otpCode });
    } catch (error) {
      const invalid = error instanceof ApiError && error.status === 400;
      setFormError(invalid ? "Mã OTP không đúng hoặc đã hết hạn." : errorMessage(error, "Không thể xác thực email."));
      return;
    }

    try {
      await login.mutateAsync(credentials);
    } catch (error) {
      setFormError(errorMessage(error, "Không thể đăng nhập."));
    }
  });

  const onResend = async () => {
    setFormError("");
    try {
      await resend.mutateAsync(credentials.email);
      toast.success("Đã gửi lại mã OTP.");
    } catch (error) {
      setFormError(errorMessage(error, "Không thể gửi lại mã."));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-ink-soft">
        Email <span className="break-all font-medium text-ink">{credentials.email}</span> chưa được xác thực. Nhập mã OTP đã gửi
        tới email này.
      </p>
      <Input
        label="Mã OTP"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        error={errors.otpCode?.message}
        {...register("otpCode")}
      />
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" loading={verify.isPending || login.isPending} className="w-full">
        Xác thực và đăng nhập
      </Button>
      <div className="flex justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Quay lại
        </Button>
        <Button variant="ghost" size="sm" loading={resend.isPending} onClick={onResend}>
          Gửi lại mã
        </Button>
      </div>
    </form>
  );
}
