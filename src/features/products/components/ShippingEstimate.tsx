import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormField";
import { useAuth } from "@/features/auth/AuthContext";
import { useAddresses } from "@/features/address/hooks/useAddresses";
import { fullAddress } from "@/features/address/types";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useShippingFee } from "../hooks/useProducts";
import { formatPrice } from "../types";

interface Props {
  organizerId: string;
  stallId: string | null;
  productItemId: string;
  quantity: number;
}

function feeError(error: unknown) {
  if (error instanceof ApiError && error.code === "E18.1") return "GHN chưa hỗ trợ tuyến giao này.";
  if (error instanceof ApiError && error.code === "E18.2") return "Gian hàng chưa có địa chỉ lấy hàng.";
  return errorMessage(error, "Không tính được phí giao hàng.");
}

export function ShippingEstimate({ organizerId, stallId, productItemId, quantity }: Props) {
  const { user } = useAuth();
  const location = useLocation();
  const { data: addresses, isLoading } = useAddresses("Shipping", Boolean(user));
  const fee = useShippingFee();
  const { reset } = fee;
  const [addressId, setAddressId] = useState("");

  const selectedId = addressId || addresses?.find((a) => a.isDefault)?.id || addresses?.[0]?.id || "";

  useEffect(() => reset(), [reset, organizerId, stallId, productItemId, quantity, selectedId]);

  if (!user) {
    return (
      <p className="text-sm text-ink-soft">
        <Link to="/login" state={{ from: location.pathname }} className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>{" "}
        để xem phí giao hàng tới địa chỉ của bạn.
      </p>
    );
  }

  if (!isLoading && addresses?.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        <Link to="/account/addresses" className="font-medium text-primary hover:underline">
          Thêm địa chỉ nhận hàng
        </Link>{" "}
        để xem phí giao hàng.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Select label="Giao tới" value={selectedId} onChange={(event) => setAddressId(event.target.value)}>
        {addresses?.map((address) => (
          <option key={address.id} value={address.id}>
            {fullAddress(address)}
          </option>
        ))}
      </Select>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          loading={fee.isPending}
          disabled={!selectedId}
          onClick={() => fee.mutate({ organizerId, stallId, addressId: selectedId, items: [{ productItemId, quantity }], boxes: [] })}
        >
          <Truck size={16} />
          Tính phí GHN
        </Button>
        {fee.data && (
          <p className="text-sm text-ink-soft">
            Phí dự kiến: <span className="font-semibold text-primary-dark">{formatPrice(fee.data.fee)}</span> ({fee.data.weightGrams} g)
          </p>
        )}
        {fee.isError && (
          <p role="alert" className="text-sm text-danger">
            {feeError(fee.error)}
          </p>
        )}
      </div>
    </div>
  );
}
