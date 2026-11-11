import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { PHONE_PATTERN } from "@/features/auth/validation";
import { errorMessage } from "@/lib/errors";
import { useSaveAddress } from "../hooks/useAddresses";
import type { Address, AddressType } from "../types";
import { AddressFields, EMPTY_ADDRESS, validateAddress, type AddressErrors, type AddressValue } from "./AddressFields";

interface ContactErrors {
  contactName?: string;
  phone?: string;
}

interface Props {
  open: boolean;
  type: AddressType;
  address: Address | null;
  onClose: () => void;
}

export function AddressFormModal({ open, type, address, onClose }: Props) {
  const toast = useToast();
  const save = useSaveAddress();
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [value, setValue] = useState<AddressValue>(EMPTY_ADDRESS);
  const [isDefault, setIsDefault] = useState(false);
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [addressErrors, setAddressErrors] = useState<AddressErrors | null>(null);

  useEffect(() => {
    if (!open) return;
    setContactName(address?.contactName ?? "");
    setPhone(address?.phone ?? "");
    setValue(
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
    setIsDefault(address?.isDefault ?? false);
    setContactErrors({});
    setAddressErrors(null);
  }, [open, address]);

  const submit = async () => {
    const nextContact: ContactErrors = {};
    if (!contactName.trim()) nextContact.contactName = "Vui lòng nhập tên người nhận";
    else if (contactName.trim().length > 100) nextContact.contactName = "Tối đa 100 ký tự";
    if (!PHONE_PATTERN.test(phone.trim())) nextContact.phone = "Số điện thoại không hợp lệ";
    const nextAddress = validateAddress(value);
    setContactErrors(nextContact);
    setAddressErrors(nextAddress);
    if (nextContact.contactName || nextContact.phone || nextAddress) return;

    const { wardId, addressLine, latitude, longitude } = value;
    try {
      await save.mutateAsync({
        id: address?.id,
        payload: { type, contactName: contactName.trim(), phone: phone.trim(), isDefault, wardId, addressLine: addressLine.trim(), latitude, longitude },
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={type === "Pickup" ? "Tên liên hệ lấy hàng" : "Tên người nhận"}
            required
            value={contactName}
            error={contactErrors.contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <Input label="Số điện thoại" required inputMode="tel" value={phone} error={contactErrors.phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {open && <AddressFields value={value} errors={addressErrors} onChange={setValue} />}
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
