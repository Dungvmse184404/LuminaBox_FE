import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select, Textarea } from "@/components/ui/FormField";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAddresses } from "@/features/address/hooks/useAddresses";
import { fullAddress } from "@/features/address/types";
import { useCart } from "@/features/cart/hooks/useCart";
import { cartItemDetail, cartItemName, groupLabel, type CartGroup } from "@/features/cart/types";
import { productApi } from "@/features/products/api/productApi";
import { formatDiscount, formatPrice } from "@/features/products/types";
import { useClaimedVouchers } from "@/features/vouchers/hooks/useVouchers";
import { voucherDiscount } from "@/features/vouchers/types";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { BoxCakePicker } from "../components/BoxCakePicker";
import { usePayOrder, usePlaceOrder } from "../hooks/useOrders";
import type { PaymentMethod } from "../types";

type Picks = Record<string, Record<string, number>>;

const groupKey = (group: CartGroup) => `${group.organizerId}-${group.stallId ?? "online"}`;

const picksOf = (picks: Picks, cartItemId: string) =>
  Object.entries(picks[cartItemId] ?? {})
    .filter(([, quantity]) => quantity > 0)
    .map(([productItemId, quantity]) => ({ productItemId, quantity }));

export function CheckoutPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const { data: cart, isLoading, isError, refetch } = useCart();
  const addresses = useAddresses("Shipping");
  const vouchers = useClaimedVouchers();
  const placeOrder = usePlaceOrder();
  const payOrder = usePayOrder();

  const [method, setMethod] = useState<PaymentMethod>("CashOnDelivery");
  const [note, setNote] = useState("");
  const [picks, setPicks] = useState<Picks>({});
  const [platformVoucherId, setPlatformVoucherId] = useState("");
  const [shopVoucherIds, setShopVoucherIds] = useState<Record<string, string>>({});

  const ids = useMemo(() => new Set((params.get("items") ?? "").split(",").filter(Boolean)), [params]);

  const groups = useMemo(
    () =>
      (cart?.groups ?? [])
        .map((group) => {
          const items = group.items.filter((item) => ids.has(item.id));
          return { ...group, items, groupSubtotal: items.reduce((sum, item) => sum + item.subtotal, 0) };
        })
        .filter((group) => group.items.length > 0),
    [cart, ids],
  );

  const address = addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0];
  const boxLines = groups.flatMap((group) => group.items.filter((item) => item.itemType === "Box"));
  const boxesReady = boxLines.every((line) => picksOf(picks, line.id).reduce((sum, p) => sum + p.quantity, 0) === line.boxCapacity);

  const fees = useQueries({
    queries: groups.map((group) => ({
      queryKey: ["shipping-fee", groupKey(group), address?.id, group.items.map((i) => [i.id, i.quantity]), picks],
      enabled: Boolean(address) && boxesReady,
      retry: false,
      queryFn: () =>
        productApi.shippingFee({
          organizerId: group.organizerId,
          stallId: group.stallId,
          addressId: address!.id,
          items: group.items
            .filter((item) => item.itemType === "Product")
            .map((item) => ({ productItemId: item.productItemId!, quantity: item.quantity })),
          boxes: group.items
            .filter((item) => item.itemType === "Box")
            .flatMap((item) => Array.from({ length: item.quantity }, () => ({ boxItemId: item.boxItemId!, selections: picksOf(picks, item.id) }))),
        }),
    })),
  });

  const platformVouchers = vouchers.data?.filter((v) => v.scope === "Platform") ?? [];
  const shopVouchers = (organizerId: string) => vouchers.data?.filter((v) => v.scope === "Organizer" && v.organizerId === organizerId) ?? [];
  const platformVoucher = platformVouchers.find((v) => v.id === platformVoucherId);

  let platformLeft = Boolean(platformVoucher);
  const totals = groups.map((group, index) => {
    const shopVoucher = shopVouchers(group.organizerId).find((v) => v.id === shopVoucherIds[group.organizerId]);
    const shopDiscount = shopVoucher ? voucherDiscount(shopVoucher, group.groupSubtotal) : 0;
    const platformDiscount = platformLeft && platformVoucher ? voucherDiscount(platformVoucher, group.groupSubtotal - shopDiscount) : 0;
    platformLeft = false;
    const fee = fees[index]?.data?.fee ?? 0;
    return { shopDiscount, platformDiscount, fee, total: group.groupSubtotal - shopDiscount - platformDiscount + fee };
  });

  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);
  const feeError = fees.find((fee) => fee.isError)?.error;
  const stripeLocked = groups.length > 1;
  const paymentMethod: PaymentMethod = stripeLocked ? "CashOnDelivery" : method;
  const canSubmit = Boolean(address) && boxesReady && !feeError && !fees.some((fee) => fee.isPending);

  const submit = async () => {
    try {
      const orders = await placeOrder.mutateAsync({
        paymentMethod,
        note: note.trim() || undefined,
        cartItemIds: groups.flatMap((group) => group.items.map((item) => item.id)),
        boxItems: boxLines.map((line) => ({ cartItemId: line.id, selections: picksOf(picks, line.id) })),
        voucherIds: [platformVoucherId, ...groups.map((group) => shopVoucherIds[group.organizerId])].filter(Boolean),
      });

      if (paymentMethod === "Stripe") {
        window.location.assign(await payOrder.mutateAsync(orders[0].id));
        return;
      }

      toast.success(orders.length > 1 ? `Đã tạo ${orders.length} đơn hàng.` : "Đã tạo đơn hàng.");
      navigate(orders.length === 1 ? `/orders/${orders[0].id}` : "/orders");
    } catch (error) {
      toast.error(errorMessage(error, "Không tạo được đơn hàng."));
    }
  };

  if (isLoading || addresses.isLoading) return <SkeletonRows />;
  if (isError) return <ErrorState message="Không tải được giỏ hàng." onRetry={() => refetch()} />;

  if (groups.length === 0) {
    return (
      <>
        <PageHeader title="Thanh toán" />
        <EmptyState
          title="Chưa chọn sản phẩm"
          action={
            <Link to="/cart" className="text-sm font-semibold text-primary hover:underline">
              Về giỏ hàng
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Thanh toán" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="grid min-w-0 gap-4">
          <Card>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-ink">Địa chỉ nhận hàng</h2>
              <Link to="/account/addresses" className="text-sm font-semibold text-primary hover:underline">
                Thay đổi
              </Link>
            </div>
            {address ? (
              <p className="flex items-start gap-2 break-words text-sm text-ink-soft">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  {address.contactName} · {address.phone} · {fullAddress(address)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-danger">Chưa có địa chỉ nhận hàng.</p>
            )}
          </Card>

          {groups.map((group, index) => (
            <Card key={groupKey(group)} className="grid gap-3">
              <h2 className="font-semibold text-ink">{groupLabel(group)}</h2>
              {group.items.map((item) => (
                <div key={item.id} className="grid gap-2">
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 break-words text-ink-soft">
                      {cartItemName(item)} · {cartItemDetail(item)} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-medium text-ink">{formatPrice(item.subtotal)}</span>
                  </div>
                  {item.itemType === "Box" && (
                    <BoxCakePicker line={item} value={picks[item.id] ?? {}} onChange={(value) => setPicks((current) => ({ ...current, [item.id]: value }))} />
                  )}
                </div>
              ))}

              {shopVouchers(group.organizerId).length > 0 && (
                <Select
                  label="Voucher của shop"
                  value={shopVoucherIds[group.organizerId] ?? ""}
                  onChange={(event) => setShopVoucherIds((current) => ({ ...current, [group.organizerId]: event.target.value }))}
                >
                  <option value="">Không dùng</option>
                  {shopVouchers(group.organizerId).map((voucher) => (
                    <option key={voucher.id} value={voucher.id}>
                      {voucher.code} · {voucher.name}
                    </option>
                  ))}
                </Select>
              )}

              <div className="flex justify-between border-t border-line pt-2 text-sm text-ink-soft">
                <span>Phí giao hàng</span>
                <span>
                  {!boxesReady
                    ? "Chọn đủ bánh để tính"
                    : fees[index]?.isPending
                      ? "Đang tính..."
                      : fees[index]?.isError
                        ? "Không tính được"
                        : formatPrice(totals[index].fee)}
                </span>
              </div>
            </Card>
          ))}

          <Textarea label="Ghi chú" rows={2} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
        </div>

        <Card className="grid gap-3 lg:sticky lg:top-40">
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Phương thức thanh toán</p>
            <div className="grid grid-cols-2 gap-2">
              {(["CashOnDelivery", "Stripe"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={paymentMethod === value}
                  disabled={value === "Stripe" && stripeLocked}
                  onClick={() => setMethod(value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                    paymentMethod === value ? "border-primary bg-primary text-white" : "border-line bg-card text-ink-soft hover:border-primary",
                  )}
                >
                  {value === "Stripe" ? "Thẻ (Stripe)" : "Khi nhận hàng"}
                </button>
              ))}
            </div>
            {stripeLocked && <p className="mt-1 text-xs text-ink-muted">Thẻ chỉ thanh toán một shop mỗi lần.</p>}
          </div>

          {platformVouchers.length > 0 && (
            <Select label="Voucher sàn" value={platformVoucherId} onChange={(event) => setPlatformVoucherId(event.target.value)}>
              <option value="">Không dùng</option>
              {platformVouchers.map((voucher) => (
                <option key={voucher.id} value={voucher.id}>
                  {voucher.code} · {voucher.name}
                </option>
              ))}
            </Select>
          )}

          <div className="grid gap-1 border-t border-line pt-3 text-sm text-ink-soft">
            <Row label="Tiền hàng" value={formatPrice(groups.reduce((sum, g) => sum + g.groupSubtotal, 0))} />
            <Row label="Giảm giá" value={formatDiscount(totals.reduce((sum, t) => sum + t.shopDiscount + t.platformDiscount, 0))} />
            <Row label="Phí giao hàng" value={formatPrice(totals.reduce((sum, t) => sum + t.fee, 0))} />
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <span>Tổng cộng</span>
            <span className="text-primary">{formatPrice(grandTotal)}</span>
          </div>

          {feeError !== undefined && <p className="text-xs text-danger">{errorMessage(feeError, "Không tính được phí giao hàng.")}</p>}

          <Button disabled={!canSubmit} loading={placeOrder.isPending || payOrder.isPending} onClick={submit}>
            {paymentMethod === "Stripe" ? "Thanh toán bằng thẻ" : "Đặt hàng"}
          </Button>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
