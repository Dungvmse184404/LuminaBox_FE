import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, MapPinPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { AddressFields, EMPTY_ADDRESS, validateAddress, type AddressErrors, type AddressValue } from "@/features/address/components/AddressFields";
import { useAddresses, useSaveAddress } from "@/features/address/hooks/useAddresses";
import { fullAddress } from "@/features/address/types";
import { useAuth } from "@/features/auth/AuthContext";
import { PHONE_PATTERN } from "@/features/auth/validation";
import { errorMessage } from "@/lib/errors";

export function DefaultAddressSection() {
  const { user } = useAuth();
  const toast = useToast();
  const addresses = useAddresses("Shipping");
  const save = useSaveAddress();
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState<AddressValue>(EMPTY_ADDRESS);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [errors, setErrors] = useState<AddressErrors | null>(null);

  const list = addresses.data ?? [];
  const current = list.find((address) => address.isDefault) ?? list[0];
  const profilePhone = user?.phone?.trim() ?? "";

  const startAdding = () => {
    setValue(EMPTY_ADDRESS);
    setPhone(profilePhone);
    setPhoneError(undefined);
    setErrors(null);
    setAdding(true);
  };

  const submit = async () => {
    if (!user) return;
    const invalid = validateAddress(value);
    const badPhone = PHONE_PATTERN.test(phone.trim()) ? undefined : "Số điện thoại không hợp lệ";
    setErrors(invalid);
    setPhoneError(badPhone);
    if (invalid || badPhone) return;
    const { wardId, addressLine, latitude, longitude } = value;
    try {
      await save.mutateAsync({
        payload: {
          type: "Shipping",
          contactName: user.fullName.trim(),
          phone: phone.trim(),
          wardId,
          addressLine: addressLine.trim(),
          isDefault: true,
          latitude,
          longitude,
        },
      });
      toast.success("Đã thêm địa chỉ.");
      setAdding(false);
    } catch (error) {
      toast.error(errorMessage(error, "Không thêm được địa chỉ."));
    }
  };

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">Địa chỉ của bạn</h3>
        {current && (
          <Link to="/account/addresses" className="text-sm font-semibold text-primary hover:underline">
            Quản lý địa chỉ ({list.length})
          </Link>
        )}
      </div>

      {addresses.isLoading ? (
        <Skeleton className="h-14 w-full" />
      ) : addresses.isError ? (
        <ErrorState message="Không tải được địa chỉ." onRetry={() => addresses.refetch()} />
      ) : current ? (
        <div className="flex gap-2 rounded-lg border border-line bg-cream/30 p-3 text-sm">
          <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="font-medium text-ink">
              {current.contactName} · {current.phone}
              {current.isDefault && <span className="ml-2 text-xs font-semibold text-success">Mặc định</span>}
            </p>
            <p className="break-words text-ink-soft">{fullAddress(current)}</p>
          </div>
        </div>
      ) : adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-3 rounded-lg border border-line p-3"
          noValidate
        >
          <p className="text-sm text-ink-soft">
            Người nhận: <span className="font-medium text-ink">{user?.fullName}</span>
            {profilePhone && ` · ${profilePhone}`}
          </p>
          {!profilePhone && (
            <Input label="Số điện thoại nhận hàng" required inputMode="tel" value={phone} error={phoneError} onChange={(e) => setPhone(e.target.value)} />
          )}
          <AddressFields value={value} errors={errors} onChange={setValue} />
          <div className="flex gap-2">
            <Button type="submit" loading={save.isPending}>
              Lưu địa chỉ
            </Button>
            <Button variant="outline" onClick={() => setAdding(false)}>
              Hủy
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-line bg-cream/30 p-4">
          <MapPinPlus size={22} className="shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">Có vẻ bạn chưa thêm địa chỉ nào.</p>
            <p className="text-sm text-ink-muted">Thêm địa chỉ nhận hàng để đặt bánh nhanh hơn, không phải nhập lại mỗi lần.</p>
          </div>
          <Button onClick={startAdding}>
            <Plus size={16} /> Thêm địa chỉ
          </Button>
        </div>
      )}
    </div>
  );
}
