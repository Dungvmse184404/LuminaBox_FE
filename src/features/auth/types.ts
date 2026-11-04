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
}
