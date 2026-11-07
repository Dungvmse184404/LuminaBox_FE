import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/Autocomplete";
import { cn } from "@/lib/cn";

const SUGGESTION_LIMIT = 8;

const INPUT_CLASS =
  "w-full rounded-lg border border-line bg-card py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary/15";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delayMs?: number;
  className?: string;
  suggestions?: AutocompleteOption[];
}

export function SearchInput({ value, onChange, placeholder = "Tìm kiếm...", delayMs = 350, className, suggestions }: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), delayMs);
    return () => clearTimeout(timer);
  }, [draft, value, onChange, delayMs]);

  const commit = (text: string) => {
    setDraft(text);
    onChange(text);
  };

  return (
    <div className={cn("relative", className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-muted" />
      {suggestions ? (
        <Autocomplete
          freeText
          filterOptions
          ariaLabel={placeholder}
          placeholder={placeholder}
          options={suggestions}
          limit={SUGGESTION_LIMIT}
          text={draft}
          onTextChange={setDraft}
          onPick={(option) => option && commit(option.name)}
          onSubmit={commit}
          inputClassName={INPUT_CLASS}
          ghostClassName="border border-transparent pl-9 pr-3 text-sm"
        />
      ) : (
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={INPUT_CLASS} />
      )}
    </div>
  );
}
