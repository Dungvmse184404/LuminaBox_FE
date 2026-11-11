import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/FormField";
import { ErrorState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { PHONE_PATTERN } from "@/features/auth/validation";
import { errorMessage } from "@/lib/errors";
import { useOrganizerProfile, useUpdateOrganizerProfile } from "../hooks/useOrganizerProfile";

const schema = z.object({
  brandName: z.string().trim().min(1, "Vui lòng nhập tên thương hiệu").max(150, "Tối đa 150 ký tự"),
  contactPhone: z
    .string()
    .trim()
    .refine((value) => value === "" || PHONE_PATTERN.test(value), "Số điện thoại không hợp lệ (ví dụ 0912345678)"),
  contactEmail: z
    .string()
    .trim()
    .max(255, "Tối đa 255 ký tự")
    .refine((value) => value === "" || z.string().email().safeParse(value).success, "Email không hợp lệ"),
  businessInfo: z.string().trim().max(2000, "Tối đa 2000 ký tự"),
});

type FormValues = z.infer<typeof schema>;

export function ShopProfileForm() {
  const toast = useToast();
  const profile = useOrganizerProfile(true);
  const save = useUpdateOrganizerProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const data = profile.data;
    if (data) reset({ brandName: data.brandName, contactPhone: data.contactPhone ?? "", contactEmail: data.contactEmail ?? "", businessInfo: data.businessInfo ?? "" });
  }, [profile.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
      toast.success("Đã cập nhật hồ sơ cửa hàng.");
    } catch (error) {
      toast.error(errorMessage(error, "Không cập nhật được hồ sơ cửa hàng."));
    }
  });

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-semibold text-ink">Hồ sơ cửa hàng</h2>
        {profile.data && (
          <StatusBadge status={profile.data.status} label={profile.data.status === "Active" ? "Đang hoạt động" : "Đang bị tạm khóa"} />
        )}
      </div>
      {profile.isLoading ? (
        <SkeletonRows rows={3} />
      ) : profile.isError ? (
        <ErrorState message="Không tải được hồ sơ cửa hàng." onRetry={() => profile.refetch()} />
      ) : (
        <>
          {profile.data?.status === "Suspended" && profile.data.suspendReason && (
            <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">Lý do tạm khóa: {profile.data.suspendReason}</p>
          )}
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
            <Input label="Tên thương hiệu" required className="sm:col-span-2" error={errors.brandName?.message} {...register("brandName")} />
            <Input label="Số điện thoại liên hệ" type="tel" error={errors.contactPhone?.message} {...register("contactPhone")} />
            <Input label="Email liên hệ" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
            <Textarea label="Giới thiệu cửa hàng" rows={4} className="sm:col-span-2" error={errors.businessInfo?.message} {...register("businessInfo")} />
            <div className="sm:col-span-2">
              <Button type="submit" loading={save.isPending} disabled={!isDirty}>
                Lưu hồ sơ cửa hàng
              </Button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
}
