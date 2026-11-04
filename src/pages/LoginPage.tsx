import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { VerifyOtpForm } from "@/features/auth/components/VerifyOtpForm";
import type { Credentials } from "@/features/auth/types";

export function LoginPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [unverified, setUnverified] = useState<Credentials | null>(null);
  const from = (location.state as { from?: string } | null)?.from;

  if (user) return <Navigate to={from ?? "/"} replace />;

  if (unverified) {
    return (
      <AuthShell title="Xác thực email" subtitle="Nhập mã OTP để kích hoạt tài khoản của bạn.">
        <VerifyOtpForm credentials={unverified} onBack={() => setUnverified(null)} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay lại LuminaBox."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/register" state={{ from }} className="font-semibold text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <LoginForm onUnverified={setUnverified} />
    </AuthShell>
  );
}
