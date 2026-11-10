import { Input } from "@/components/ui/FormField";
import { AddressFields, EMPTY_ADDRESS, validateAddress, type AddressErrors, type AddressValue } from "./AddressFields";

export interface ContactAddressValue {
  contactName: string;
  phone: string;
  address: AddressValue;
}

export interface ContactAddressErrors extends AddressErrors {
  contactName?: string;
  phone?: string;
}

export const EMPTY_CONTACT_ADDRESS: ContactAddressValue = { contactName: "", phone: "", address: EMPTY_ADDRESS };

export const PHONE_PATTERN = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export function validateContactAddress(value: ContactAddressValue): ContactAddressErrors | null {
  const errors: ContactAddressErrors = { ...validateAddress(value.address) };
  const name = value.contactName.trim();
  if (!name) errors.contactName = "Vui lòng nhập tên liên hệ";
  else if (name.length > 100) errors.contactName = "Tối đa 100 ký tự";
  if (!PHONE_PATTERN.test(value.phone.trim())) errors.phone = "Số điện thoại không hợp lệ";
  return Object.values(errors).some(Boolean) ? errors : null;
}

export const isContactAddressEmpty = (value: ContactAddressValue) =>
  !value.contactName.trim() && !value.phone.trim() && !value.address.wardId && !value.address.addressLine.trim();

interface Props {
  value: ContactAddressValue;
  onChange: (value: ContactAddressValue) => void;
  errors?: ContactAddressErrors | null;
  required?: boolean;
  withMap?: boolean;
}

export function ContactAddressFields({ value, onChange, errors, required = true, withMap = true }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Tên liên hệ"
          required={required}
          value={value.contactName}
          error={errors?.contactName}
          onChange={(e) => onChange({ ...value, contactName: e.target.value })}
        />
        <Input
          label="Số điện thoại"
          required={required}
          inputMode="tel"
          value={value.phone}
          error={errors?.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
        />
      </div>
      <AddressFields required={required} withMap={withMap} value={value.address} errors={errors} onChange={(address) => onChange({ ...value, address })} />
    </div>
  );
}
