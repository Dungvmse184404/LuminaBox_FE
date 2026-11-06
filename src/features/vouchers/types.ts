export type VoucherScope = "Platform" | "Organizer";
export type DiscountType = "Percent" | "Fixed";

interface VoucherBase {
  code: string;
  scope: VoucherScope;
  organizerId: string | null;
  organizerBrandName: string | null;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  endAt: string;
}

export interface Voucher extends VoucherBase {
  id: string;
}

export interface ClaimedVoucher extends VoucherBase {
  id: string;
  voucherId: string;
}

export function voucherDiscount(voucher: VoucherBase, amount: number) {
  const raw = voucher.discountType === "Percent" ? Math.round((amount * voucher.discountValue) / 100) : voucher.discountValue;
  const capped = voucher.discountType === "Percent" && voucher.maxDiscountAmount !== null ? Math.min(raw, voucher.maxDiscountAmount) : raw;
  return Math.min(amount, capped);
}
