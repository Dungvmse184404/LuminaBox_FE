import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { AddressFields, EMPTY_ADDRESS, validateAddress, type AddressErrors, type AddressValue } from "@/features/address/components/AddressFields";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useSaveStall } from "../hooks/useStalls";
import type { StallDetail } from "../types";

interface Fields {
  code: string;
  name: string;
  rentalPrice: string;
  description: string;
}

type FieldErrors = Partial<Record<keyof Fields, string>>;

const EMPTY_FIELDS: Fields = { code: "", name: "", rentalPrice: "", description: "" };

function validate(fields: Fields): FieldErrors | null {
  const errors: FieldErrors = {};
  if (!fields.code.trim()) errors.code = "Vui lòng nhập mã gian";
  else if (fields.code.trim().length > 50) errors.code = "Tối đa 50 ký tự";
  if (!fields.name.trim()) errors.name = "Vui lòng nhập tên gian";
  else if (fields.name.trim().length > 200) errors.name = "Tối đa 200 ký tự";
  const price = Number(fields.rentalPrice);
  if (!fields.rentalPrice || !Number.isFinite(price) || price <= 0) errors.rentalPrice = "Giá thuê phải lớn hơn 0";
  if (fields.description.length > 2000) errors.description = "Tối đa 2000 ký tự";
  return Object.keys(errors).length > 0 ? errors : null;
}

interface Props {
  open: boolean;
  stall: StallDetail | null;
  onClose: () => void;
}

export function StallFormModal({ open, stall, onClose }: Props) {
  const toast = useToast();
  const save = useSaveStall();
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<FieldErrors | null>(null);
  const [addressErrors, setAddressErrors] = useState<AddressErrors | null>(null);

  useEffect(() => {
    if (!open) return;
    setFields(
      stall
        ? { code: stall.code, name: stall.name, rentalPrice: String(stall.rentalPrice), description: stall.description ?? "" }
        : EMPTY_FIELDS,
    );
    setAddress(
      stall
        ? {
            provinceId: stall.provinceId,
            districtId: stall.districtId,
            wardId: stall.wardId,
            addressLine: stall.addressLine,
            latitude: stall.latitude,
            longitude: stall.longitude,
          }
        : EMPTY_ADDRESS,
    );
    setErrors(null);
    setAddressErrors(null);
  }, [open, stall]);

  const set = (key: keyof Fields) => (event: { target: { value: string } }) => setFields((current) => ({ ...current, [key]: event.target.value }));

  const submit = async () => {
    const invalid = validate(fields);
    const invalidAddress = validateAddress(address);
    setErrors(invalid);
    setAddressErrors(invalidAddress);
    if (invalid || invalidAddress) return;
    try {
      await save.mutateAsync({
        id: stall?.id,
        payload: {
          code: fields.code.trim(),
          name: fields.name.trim(),
          rentalPrice: Number(fields.rentalPrice),
          description: fields.description.trim() || undefined,
          wardId: address.wardId,
          addressLine: address.addressLine.trim(),
          latitude: address.latitude ?? undefined,
          longitude: address.longitude ?? undefined,
        },
      });
      toast.success(stall ? "Đã cập nhật gian hàng." : "Đã thêm gian hàng.");
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setErrors({ code: "Mã gian này đã tồn tại" });
      else toast.error(errorMessage(error, "Không lưu được gian hàng."));
    }
  };

  return (
    <Modal
      open={open}
      title={stall ? "Sửa gian hàng" : "Thêm gian hàng"}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            Lưu
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-3"
        noValidate
      >
        <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <Input label="Mã gian" required value={fields.code} onChange={set("code")} error={errors?.code} />
          <Input label="Tên gian" required value={fields.name} onChange={set("name")} error={errors?.name} />
        </div>
        <Input
          label="Giá thuê mỗi ngày (₫)"
          required
          type="number"
          inputMode="numeric"
          min={1}
          value={fields.rentalPrice}
          onChange={set("rentalPrice")}
          error={errors?.rentalPrice}
        />
        {open && <AddressFields value={address} errors={addressErrors} onChange={setAddress} />}
        <Textarea label="Mô tả" rows={3} value={fields.description} onChange={set("description")} error={errors?.description} />
      </form>
    </Modal>
  );
}
