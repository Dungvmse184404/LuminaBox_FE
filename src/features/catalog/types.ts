export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface CategoryPayload {
  name: string;
  description?: string;
}
