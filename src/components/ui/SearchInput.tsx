import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delayMs?: number;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Tìm kiếm...", delayMs = 350, className }: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), delayMs);
    return () => clearTimeout(timer);
  }, [draft, value, onChange, delayMs]);

  return (
    <div className={cn("relative", className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-line bg-card py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </div>
  );
}
