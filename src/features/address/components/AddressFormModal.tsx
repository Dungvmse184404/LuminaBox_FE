import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/errors";
import { useDistricts, useProvinces, useSaveAddress, useWards } from "../hooks/useAddresses";
import type { Address, AddressType } from "../types";

const schema = z.object({
  contactName: z.string().trim().min(1, "Vui lòng nhập tên liên hệ").max(100, "Tối đa 100 ký tự"),
  phone: z.string().trim().regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, "Số điện thoại không hợp lệ"),
  addressLine: z.string().trim().min(1, "Vui lòng nhập số nhà, tên đường").max(255, "Tối đa 255 ký tự"),
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
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [wardId, setWardId] = useState("");
  const [wardError, setWardError] = useState("");

  const provinces = useProvinces();
  const districts = useDistricts(provinceId);
  const wards = useWards(districtId);

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
      addressLine: address?.addressLine ?? "",
      isDefault: address?.isDefault ?? false,
    });
    setProvinceId(address?.provinceId ?? "");
    setDistrictId(address?.districtId ?? "");
    setWardId(address?.wardId ?? "");
    setWardError("");
  }, [open, address, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!wardId) {
      setWardError("Vui lòng chọn đủ tỉnh, quận, phường");
      return;
    }
    try {
      await save.mutateAsync({ id: address?.id, payload: { ...values, type, wardId } });
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
        <Select
          label="Tỉnh / thành"
          required
          value={provinceId}
          onChange={(event) => {
            setProvinceId(event.target.value);
            setDistrictId("");
            setWardId("");
          }}
        >
          <option value="">Chọn tỉnh / thành</option>
          {provinces.data?.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </Select>
        <Select
          label="Quận / huyện"
          required
          disabled={!provinceId}
          value={districtId}
          onChange={(event) => {
            setDistrictId(event.target.value);
            setWardId("");
          }}
        >
          <option value="">Chọn quận / huyện</option>
          {districts.data?.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </Select>
        <Select
          label="Phường / xã"
          required
          disabled={!districtId}
          value={wardId}
          error={wardError}
          onChange={(event) => {
            setWardId(event.target.value);
            setWardError("");
          }}
        >
          <option value="">Chọn phường / xã</option>
          {wards.data?.map((ward) => (
            <option key={ward.id} value={ward.id}>
              {ward.name}
            </option>
          ))}
        </Select>
        <Input label="Số nhà, tên đường" required error={errors.addressLine?.message} {...register("addressLine")} />
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
