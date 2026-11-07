import { forwardRef, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CONTROL, FieldShell } from "@/components/ui/FormField";
import { cn } from "@/lib/cn";
import { foldText } from "@/lib/text";

export interface AutocompleteOption {
  id: string;
  name: string;
  hint?: string;
}

export interface AutocompleteProps {
  label?: string;
  ariaLabel?: string;
  options: AutocompleteOption[];
  text: string;
  onPick: (option: AutocompleteOption | null, advance: boolean) => void;
  onTextChange?: (text: string) => void;
  freeText?: boolean;
  loading?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  coreName?: (folded: string) => string;
  normalizeQuery?: (folded: string) => string;
  filterOptions?: boolean;
  onSubmit?: (text: string) => void;
  hideList?: boolean;
  limit?: number;
  className?: string;
  inputClassName?: string;
  ghostClassName?: string;
  tabIndex?: number;
}

const same = (value: string) => value;

const initials = (folded: string) =>
  folded
    .split(" ")
    .map((word) => word[0])
    .join("");

function score(name: string, query: string, coreName: (folded: string) => string) {
  const full = foldText(name);
  const core = coreName(full);
  if (core.startsWith(query)) return 0;
  if (full.startsWith(query)) return 1;
  if (full.split(" ").some((word) => word.startsWith(query))) return 2;
  if (initials(core).startsWith(query.replaceAll(" ", ""))) return 3;
  return full.includes(query) ? 4 : null;
}

function remainder(name: string, typed: string, coreName: (folded: string) => string) {
  const query = foldText(typed).trimStart();
  const full = foldText(name);
  const core = coreName(full);
  const plain = name.normalize("NFC");
  if (full.startsWith(query)) return plain.slice(query.length);
  if (core.startsWith(query)) return plain.slice(full.length - core.length + query.length);
  return null;
}

export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(function Autocomplete(
  {
    label,
    ariaLabel,
    options,
    text,
    onPick,
    onTextChange,
    freeText = false,
    loading,
    required,
    disabled,
    placeholder,
    error,
    coreName = same,
    normalizeQuery = same,
    filterOptions = !freeText,
    onSubmit,
    hideList = false,
    limit,
    className,
    inputClassName,
    ghostClassName,
    tabIndex,
  },
  ref,
) {
  const id = useId();
  const listId = `${id}-list`;
  const listRef = useRef<HTMLUListElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(freeText ? -1 : 0);

  const typed = freeText ? text : (draft ?? "");
  const shown = freeText ? text : (draft ?? text);
  const hasTyped = typed.trim() !== "";
  const searchMode = onSubmit !== undefined;

  const matches = useMemo(() => {
    const query = normalizeQuery(foldText(typed).trimStart());
    if (!filterOptions || !query) return options;
    return options
      .map((option) => ({ option, rank: score(option.name, query, coreName) }))
      .filter((match): match is { option: AutocompleteOption; rank: number } => match.rank !== null)
      .sort((a, b) => a.rank - b.rank || a.option.name.localeCompare(b.option.name, "vi", { numeric: true }))
      .map((match) => match.option)
      .slice(0, limit);
  }, [coreName, filterOptions, limit, normalizeQuery, options, typed]);

  const candidate = matches[active] ?? (freeText ? matches.find((option) => remainder(option.name, typed, coreName)) : undefined);
  const rest = candidate ? remainder(candidate.name, typed, coreName) : null;
  const suggesting = open && hasTyped && candidate !== undefined && !(searchMode && rest === "");
  const showList = open && !disabled && !hideList && (!searchMode || hasTyped) && (matches.length > 0 || (!freeText && (loading || hasTyped)));

  useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const accept = (option: AutocompleteOption, advance = true) => {
    setDraft(null);
    setOpen(false);
    onPick(option, advance);
  };

  const openList = () => {
    setOpen(true);
    setActive(freeText ? -1 : Math.max(0, options.findIndex((option) => option.name === text)));
  };

  const move = (step: number) => {
    if (!open) return openList();
    if (matches.length === 0) return;
    setActive((index) => (index < 0 ? (step > 0 ? 0 : matches.length - 1) : (index + step + matches.length) % matches.length));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "ArrowRight" && suggesting && event.currentTarget.selectionStart === shown.length) {
      event.preventDefault();
      accept(candidate);
    } else if (event.key === "Enter") {
      if (searchMode && active < 0) {
        event.preventDefault();
        setOpen(false);
        onSubmit(shown);
      } else if (open && candidate) {
        event.preventDefault();
        accept(candidate);
      } else if (!freeText && hasTyped) {
        event.preventDefault();
      }
    } else if (event.key === "Tab" && suggesting) {
      if (searchMode) event.preventDefault();
      accept(candidate);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setDraft(null);
    }
  };

  const onChange = (value: string) => {
    setOpen(true);
    setActive(freeText ? -1 : 0);
    if (freeText) return onTextChange?.(value);
    setDraft(value);
    if (!value) onPick(null, false);
  };

  const onBlur = () => {
    setOpen(false);
    if (freeText || draft === null) return;
    const target = foldText(draft).trim();
    const exact = options.find((option) => foldText(option.name) === target || coreName(foldText(option.name)) === target);
    if (target && exact) onPick(exact, false);
    setDraft(null);
  };

  return (
    <FieldShell id={id} label={label} required={required} error={error} className={className}>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="both"
          aria-activedescendant={showList && active >= 0 ? `${id}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={placeholder}
          tabIndex={tabIndex}
          value={shown}
          className={inputClassName ?? cn(CONTROL, error ? "border-primary" : "border-line")}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onClick={() => !open && openList()}
          onFocus={(event) => {
            if (!freeText) event.target.select();
            openList();
          }}
        />

        {suggesting && (
          <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre", ghostClassName ?? "border border-transparent px-3.5 text-sm")}>
            <span className="invisible">{shown}</span>
            <span className="truncate text-ink-muted">{rest ?? `  →  ${candidate.name}`}</span>
          </div>
        )}

        {showList && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-line bg-card shadow-lg" onMouseDown={(event) => event.preventDefault()}>
            <ul ref={listRef} id={listId} role="listbox" aria-label={label ?? ariaLabel} className="max-h-56 overflow-y-auto py-1 text-sm">
              {matches.map((option, index) => (
                <li
                  key={option.id}
                  id={`${id}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  className={cn("cursor-pointer px-3.5 py-2", index === active ? "bg-primary-soft text-primary-dark" : "text-ink hover:bg-cream")}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => accept(option)}
                >
                  <span className="block truncate">{option.name}</span>
                  {option.hint && <span className="block truncate text-xs text-ink-muted">{option.hint}</span>}
                </li>
              ))}
              {matches.length === 0 && <li className="px-3.5 py-2 text-ink-muted">{loading ? "Đang tải..." : "Không tìm thấy"}</li>}
            </ul>
          </div>
        )}
      </div>
    </FieldShell>
  );
});
