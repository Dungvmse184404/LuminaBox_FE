export type UserRole = "User" | "Organization" | "Manager";

export interface Credentials {
  email: string;
  password: string;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}
