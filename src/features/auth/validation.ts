import { z } from "zod";

export const PHONE_PATTERN = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export const phoneSchema = z.string().trim().regex(PHONE_PATTERN, "Số điện thoại không hợp lệ (ví dụ 0912345678)");

export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự")
  .regex(/[A-Z]/, "Mật khẩu cần có chữ hoa")
  .regex(/[a-z]/, "Mật khẩu cần có chữ thường")
  .regex(/[0-9]/, "Mật khẩu cần có chữ số")
  .regex(/[^a-zA-Z0-9]/, "Mật khẩu cần có ký tự đặc biệt");

export const otpSchema = z.string().trim().regex(/^\d{6}$/, "Mã OTP gồm 6 chữ số");
