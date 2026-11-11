import { Input } from "@/components/ui/FormField";
import { AddressFields, validateAddress, type AddressErrors } from "@/features/address/components/AddressFields";
import { PHONE_PATTERN } from "@/features/auth/validation";
import type { PickupValue } from "../draft";

export interface PickupErrors extends AddressErrors {
  contactName?: string;
  phone?: string;
}

export function validatePickup(value: PickupValue): PickupErrors | null {
  const errors: PickupErrors = { ...validateAddress(value.address) };
  const name = value.contactName.trim();
  if (!name) errors.contactName = "Vui lòng nhập tên liên hệ";
  else if (name.length > 100) errors.contactName = "Tối đa 100 ký tự";
  if (!PHONE_PATTERN.test(value.phone.trim())) errors.phone = "Số điện thoại không hợp lệ";
  return Object.values(errors).some(Boolean) ? errors : null;
}

interface Props {
  value: PickupValue;
  errors?: PickupErrors | null;
  onChange: (value: PickupValue) => void;
}

export function PickupAddressFields({ value, errors, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Tên liên hệ lấy hàng" value={value.contactName} error={errors?.contactName} onChange={(e) => onChange({ ...value, contactName: e.target.value })} />
        <Input
          label="Số điện thoại lấy hàng"
          inputMode="tel"
          value={value.phone}
          error={errors?.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
        />
      </div>
      <AddressFields required={false} value={value.address} errors={errors} onChange={(address) => onChange({ ...value, address })} />
    </div>
  );
}
