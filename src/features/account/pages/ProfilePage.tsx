import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/features/auth/AuthContext";
import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { PersonalInfoForm } from "../components/PersonalInfoForm";
import { ShopProfileForm } from "../components/ShopProfileForm";

export function ProfilePage() {
  const { hasRole } = useAuth();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Hồ sơ của tôi" description="Thông tin tài khoản, mật khẩu và hồ sơ cửa hàng." />
      <div className="grid gap-4">
        <PersonalInfoForm />
        {hasRole("Organization") && <ShopProfileForm />}
        <ChangePasswordForm />
      </div>
    </div>
  );
}
