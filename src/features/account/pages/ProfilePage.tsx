import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/features/auth/AuthContext";
import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { PersonalInfoForm } from "../components/PersonalInfoForm";
import { ShopProfileForm } from "../components/ShopProfileForm";

export function ProfilePage() {
  const { hasRole } = useAuth();

  return (
    <>
      <PageHeader title="Hồ sơ của tôi" description="Thông tin tài khoản, mật khẩu và hồ sơ cửa hàng." />
      <div className="grid max-w-3xl gap-4">
        <PersonalInfoForm />
        {hasRole("Organization") && <ShopProfileForm />}
        <ChangePasswordForm />
      </div>
    </>
  );
}
