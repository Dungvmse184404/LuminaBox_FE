import { Link } from "react-router-dom";
import { Moon } from "lucide-react";
import { useCategories } from "@/features/catalog/hooks/useCategories";
import { SectionHeader } from "./SectionHeader";

const QUERY = { pageSize: 12, sortBy: "name", isDescending: false };

export function CategoryShortcuts() {
  const { data } = useCategories(QUERY);
  if (!data?.items.length) return null;

  return (
    <section aria-labelledby="categories-title">
      <SectionHeader id="categories-title" title="Danh mục bánh" to="/products" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {data.items.map((category) => (
          <Link
            key={category.id}
            to={`/products?categoryId=${category.id}`}
            className="lb-card lb-card-hover flex flex-col items-center gap-2 p-4 text-sm font-medium text-ink-soft hover:text-primary"
          >
            <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
              <Moon size={20} />
            </span>
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
