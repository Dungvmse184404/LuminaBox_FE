export type UserRole = "User" | "Organization" | "Manager";

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}
