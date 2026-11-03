export interface Paged<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface ListParams {
  search?: string;
  sortBy?: string;
  isDescending?: boolean;
  page?: number;
  pageSize?: number;
}
