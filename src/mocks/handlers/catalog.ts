import type { Category, CategoryPayload } from "@/features/catalog/types";
import { listParams, mock, mockError, newId, paginate } from "@/mocks/server";

const categories: Category[] = [
  { id: newId(), name: "Bánh nướng", description: "Vỏ nướng vàng, truyền thống" },
  { id: newId(), name: "Bánh dẻo", description: "Vỏ dẻo, mềm, ăn lạnh" },
  { id: newId(), name: "Bánh chay", description: "Nhân thực vật" },
  { id: newId(), name: "Bánh tuyết", description: null },
];

mock("GET", "/cake-categories", ({ query }) => {
  const { search, sortBy, isDescending } = listParams(query);
  const keyword = search?.trim().toLowerCase();
  const rows = categories.filter((c) => !keyword || c.name.toLowerCase().includes(keyword));
  if (sortBy === "name") rows.sort((a, b) => a.name.localeCompare(b.name) * (isDescending ? -1 : 1));
  return paginate(rows, query);
});

mock(
  "POST",
  "/cake-categories",
  ({ body }) => {
    const { name, description } = body as CategoryPayload;
    if (categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      throw mockError(409, `Loại bánh "${name}" đã tồn tại.`);
    }
    const created: Category = { id: newId(), name: name.trim(), description: description?.trim() || null };
    categories.unshift(created);
    return created;
  },
  "Đã tạo loại bánh.",
);
