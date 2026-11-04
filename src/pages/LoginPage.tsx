import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { VerifyOtpForm } from "@/features/auth/components/VerifyOtpForm";
import type { Credentials } from "@/features/auth/types";

export function LoginPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [unverified, setUnverified] = useState<Credentials | null>(null);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  return (
    <Container className="max-w-md py-16">
      <PageHeader title={unverified ? "Xác thực email" : "Đăng nhập"} />
      <Card>
        {unverified ? (
          <VerifyOtpForm credentials={unverified} onBack={() => setUnverified(null)} />
        ) : (
          <LoginForm onUnverified={setUnverified} />
        )}
      </Card>
    </Container>
  );
}
