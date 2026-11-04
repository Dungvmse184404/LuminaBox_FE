import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { AddressFields, EMPTY_ADDRESS, validateAddress, type AddressErrors } from "@/features/address/components/AddressFields";
import { useSaveAddress } from "@/features/address/hooks/useAddresses";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { VerifyOtpForm } from "@/features/auth/components/VerifyOtpForm";
import { useRegister } from "@/features/auth/hooks/useLogin";
import type { Credentials } from "@/features/auth/types";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

const schema = z
  .object({
    fullName: z.string().trim().min(1, "Vui lòng nhập họ tên").max(100, "Họ tên tối đa 100 ký tự"),
    email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    phone: z.string().trim().regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, "Số điện thoại không hợp lệ (ví dụ 0912345678)"),
    password: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .regex(/[A-Z]/, "Mật khẩu cần có chữ hoa")
      .regex(/[a-z]/, "Mật khẩu cần có chữ thường")
      .regex(/[0-9]/, "Mật khẩu cần có chữ số")
      .regex(/[^a-zA-Z0-9]/, "Mật khẩu cần có ký tự đặc biệt"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { user } = useAuth();
  const location = useLocation();
  const registerAccount = useRegister();
  const saveAddress = useSaveAddress();
  const toast = useToast();
  const [created, setCreated] = useState<(Credentials & { fullName: string; phone: string }) | null>(null);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<AddressErrors | null>(null);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const from = (location.state as { from?: string } | null)?.from;

  if (user) return <Navigate to={from ?? "/"} replace />;

  const saveFirstAddress = async () => {
    if (!created || !address.wardId) return;
    const { wardId, addressLine, latitude, longitude } = address;
    const { fullName: contactName, phone } = created;
    try {
      await saveAddress.mutateAsync({
        payload: { type: "Shipping", contactName, phone, wardId, addressLine: addressLine.trim(), isDefault: true, latitude, longitude },
      });
    } catch {
      toast.error("Đã tạo tài khoản nhưng chưa lưu được địa chỉ. Bạn thêm lại trong sổ địa chỉ nhé.");
    }
  };

  if (created) {
    return (
      <AuthShell title="Xác thực email" subtitle="Chỉ còn một bước nữa để hoàn tất đăng ký.">
        <VerifyOtpForm credentials={created} onBack={() => setCreated(null)} onVerified={saveFirstAddress} />
      </AuthShell>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    const invalid = address.provinceId || address.addressLine.trim() ? validateAddress(address) : null;
    setAddressErrors(invalid);
    if (invalid) return;

    try {
      await registerAccount.mutateAsync({ ...values, address: "" });
      setCreated({ email: values.email, password: values.password, fullName: values.fullName, phone: values.phone });
      window.scrollTo({ top: 0 });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setError("email", { message: "Email này đã được đăng ký" });
      else setFormError(errorMessage(error, "Không thể đăng ký."));
    }
  });

  return (
    <AuthShell
      wide
      title="Tạo tài khoản"
      subtitle="Đăng ký để mua bánh Trung thu hoặc trở thành đối tác bán hàng."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" state={{ from }} className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm text-primary-dark">
            {formError}
          </p>
        )}
        <Input label="Họ và tên" autoComplete="name" required error={errors.fullName?.message} {...register("fullName")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
          <Input label="Số điện thoại" type="tel" autoComplete="tel" required error={errors.phone?.message} {...register("phone")} />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Địa chỉ nhận hàng (không bắt buộc)</legend>
          <AddressFields required={false} value={address} errors={addressErrors} onChange={setAddress} />
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Mật khẩu" type="password" autoComplete="new-password" required error={errors.password?.message} {...register("password")} />
          <Input
            label="Nhập lại mật khẩu"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>
        {!errors.password && <p className="text-xs text-ink-soft">Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.</p>}
        <Button type="submit" loading={registerAccount.isPending} className="w-full">
          Đăng ký
        </Button>
      </form>
    </AuthShell>
  );
}
