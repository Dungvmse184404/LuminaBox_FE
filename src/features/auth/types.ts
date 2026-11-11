export type UserRole = "User" | "Organization" | "Manager";

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends Credentials {
  fullName: string;
  phone: string;
  address: string;
  confirmPassword: string;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  address?: string | null;
  isEmailVerified?: boolean;
  createdAt?: string;
  organizerBrandName?: string | null;
  organizerStatus?: "Active" | "Suspended" | null;
}

export interface ProfilePayload {
  fullName: string;
  phone: string | null;
  address: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetPasswordPayload {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmNewPassword: string;
}
