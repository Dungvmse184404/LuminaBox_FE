import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/errors";
import { useSaveAddress } from "../hooks/useAddresses";
import type { Address, AddressType } from "../types";
import {
  ContactAddressFields,
  EMPTY_CONTACT_ADDRESS,
  validateContactAddress,
  type ContactAddressErrors,
  type ContactAddressValue,
} from "./ContactAddressFields";

interface Props {
  open: boolean;
  type: AddressType;
  address: Address | null;
  onClose: () => void;
}

export function AddressFormModal({ open, type, address, onClose }: Props) {
  const toast = useToast();
  const save = useSaveAddress();
  const [value, setValue] = useState<ContactAddressValue>(EMPTY_CONTACT_ADDRESS);
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<ContactAddressErrors | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(
      address
        ? {
            contactName: address.contactName,
            phone: address.phone,
            address: {
              provinceId: address.provinceId,
              districtId: address.districtId,
              wardId: address.wardId,
              addressLine: address.addressLine,
              latitude: address.latitude,
              longitude: address.longitude,
            },
          }
        : EMPTY_CONTACT_ADDRESS,
    );
    setIsDefault(address?.isDefault ?? false);
    setErrors(null);
  }, [open, address]);

  const submit = async () => {
    const invalid = validateContactAddress(value);
    setErrors(invalid);
    if (invalid) return;

    const { wardId, addressLine, latitude, longitude } = value.address;
    try {
      await save.mutateAsync({
        id: address?.id,
        payload: { type, contactName: value.contactName.trim(), phone: value.phone.trim(), isDefault, wardId, addressLine: addressLine.trim(), latitude, longitude },
      });
      toast.success(address ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ.");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu địa chỉ."));
    }
  };

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
        {open && <ContactAddressFields value={value} errors={errors} onChange={setValue} />}
        {!address && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            Đặt làm địa chỉ mặc định
          </label>
        )}
      </form>
    </Modal>
  );
}
