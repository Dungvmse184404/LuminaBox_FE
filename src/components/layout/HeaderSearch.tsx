import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SearchInput } from "@/components/ui/SearchInput";

export function HeaderSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const onProducts = pathname === "/products";
  const current = onProducts ? (params.get("q") ?? "") : "";

  const onSearch = (q: string) => {
    if (!q && !onProducts) return;
    const next = new URLSearchParams(onProducts ? params : undefined);
    next.delete("page");
    if (q) next.set("q", q);
    else next.delete("q");
    const search = next.toString();
    navigate(`/products${search ? `?${search}` : ""}`, { replace: onProducts });
  };

  return <SearchInput value={current} onChange={onSearch} placeholder="Bạn cần tìm bánh gì?" className={className} />;
}
