import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/errors";
import { useSaveAddress } from "../hooks/useAddresses";
import type { Address, AddressType } from "../types";
import { AddressFields, EMPTY_ADDRESS, validateAddress, type AddressErrors, type AddressValue } from "./AddressFields";

const schema = z.object({
  contactName: z.string().trim().min(1, "Vui lòng nhập tên liên hệ").max(100, "Tối đa 100 ký tự"),
  phone: z.string().trim().regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, "Số điện thoại không hợp lệ"),
  isDefault: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  type: AddressType;
  address: Address | null;
  onClose: () => void;
}

export function AddressFormModal({ open, type, address, onClose }: Props) {
  const toast = useToast();
  const save = useSaveAddress();
  const [location, setLocation] = useState<AddressValue>(EMPTY_ADDRESS);
  const [locationErrors, setLocationErrors] = useState<AddressErrors | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset({
      contactName: address?.contactName ?? "",
      phone: address?.phone ?? "",
      isDefault: address?.isDefault ?? false,
    });
    setLocation(
      address
        ? {
            provinceId: address.provinceId,
            districtId: address.districtId,
            wardId: address.wardId,
            addressLine: address.addressLine,
            latitude: address.latitude,
            longitude: address.longitude,
          }
        : EMPTY_ADDRESS,
    );
    setLocationErrors(null);
  }, [open, address, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const invalid = validateAddress(location);
    setLocationErrors(invalid);
    if (invalid) return;

    const { wardId, addressLine, latitude, longitude } = location;
    try {
      await save.mutateAsync({ id: address?.id, payload: { ...values, type, wardId, addressLine: addressLine.trim(), latitude, longitude } });
      toast.success(address ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ.");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu địa chỉ."));
    }
  });

  return (
    <Modal
      open={open}
      title={address ? "Sửa địa chỉ" : "Thêm địa chỉ"}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={save.isPending} onClick={onSubmit}>
            Lưu
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Tên liên hệ" required error={errors.contactName?.message} {...register("contactName")} />
          <Input label="Số điện thoại" required inputMode="tel" error={errors.phone?.message} {...register("phone")} />
        </div>
        {open && <AddressFields withMap value={location} errors={locationErrors} onChange={setLocation} />}
        {!address && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" {...register("isDefault")} />
            Đặt làm địa chỉ mặc định
          </label>
        )}
      </form>
    </Modal>
  );
}
