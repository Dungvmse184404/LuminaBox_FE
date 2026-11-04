import { fetchAllPages } from "@/lib/api";
import type { Stall } from "../types";

export const stallApi = {
  listAll: () => fetchAllPages<Stall>("/stalls"),
};
