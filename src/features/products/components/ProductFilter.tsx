import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { cn } from "@/lib/cn";
import { foldText } from "@/lib/text";
import { useFilterRows, type FilterRowKey } from "../hooks/useFilterRows";
import type { FilterShop, FilterTag } from "../types";

type TagKind = "category" | "filling";

interface Props {
  shops: FilterShop[];
  categories: FilterTag[];
  fillings: FilterTag[];
  organizerId: string;
  categoryId: string;
  fillingId: string;
  onChange: (changes: Record<string, string>) => void;
}

const PARAM: Record<TagKind, "categoryId" | "fillingId"> = { category: "categoryId", filling: "fillingId" };
const KIND_LABEL: Record<TagKind, string> = { category: "Loại bánh", filling: "Nhân" };

const chipClass = (active: boolean, own = false) =>
  cn(
    "rounded-full border px-3 py-1 text-sm font-medium transition",
    active && (own ? "border-primary-dark bg-primary-dark text-white" : "border-primary bg-primary text-white"),
    !active && "bg-card text-ink-soft hover:border-primary hover:text-primary",
    !active && (own ? "border-dashed border-gold-deep" : "border-line"),
  );

function Fold({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={cn("grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const start = query ? foldText(text).indexOf(query) : -1;
  if (start < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-gold text-ink">{text.slice(start, start + query.length)}</mark>
      {text.slice(start + query.length)}
    </>
  );
}

export function ProductFilter({ shops, categories, fillings, organizerId, categoryId, fillingId, onChange }: Props) {
  const rows = useFilterRows();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searching) searchRef.current?.focus({ preventScroll: true });
  }, [searching]);

  const selectedOf: Record<TagKind, string> = { category: categoryId, filling: fillingId };
  const tagsOf: Record<TagKind, FilterTag[]> = { category: categories, filling: fillings };
  const shop = shops.find((s) => s.id === organizerId);
  const hasFilter = Boolean(organizerId || categoryId || fillingId);

  const hits = useMemo(() => {
    const folded = foldText(query.trim());
    return (["category", "filling"] as const)
      .flatMap((kind) => (kind === "category" ? categories : fillings).map((tag) => ({ kind, tag })))
      .filter(({ tag }) => foldText(tag.name).includes(folded))
      .sort((a, b) => foldText(a.tag.name).localeCompare(foldText(b.tag.name)));
  }, [query, categories, fillings]);

  const tagOptions = useMemo(() => {
    const byName = new Map<string, { id: string; name: string }>();
    [...categories, ...fillings].forEach((tag) => byName.set(foldText(tag.name), { id: tag.id, name: tag.name }));
    return [...byName.values()];
  }, [categories, fillings]);

  const pickShop = (next: FilterShop) => {
    const selected = organizerId === next.id;
    const changes: Record<string, string> = { organizerId: selected ? "" : next.id, brand: selected ? "" : next.name };
    (["category", "filling"] as const).forEach((kind) => {
      const tag = tagsOf[kind].find((t) => t.id === selectedOf[kind]);
      if (tag?.organizerId && tag.organizerId !== changes.organizerId) changes[PARAM[kind]] = "";
    });
    onChange(changes);
  };

  const pickTag = (kind: TagKind, tag: FilterTag) => {
    const selected = selectedOf[kind] === tag.id;
    const changes: Record<string, string> = { [PARAM[kind]]: selected ? "" : tag.id };
    if (!selected && tag.organizerId) {
      changes.organizerId = tag.organizerId;
      changes.brand = tag.organizerBrandName ?? "";
    }
    onChange(changes);
  };

  const toggleSearch = () => {
    rows.close();
    setSearching((value) => !value);
  };

  const row = (key: FilterRowKey, label: string, full: ReactNode, summary: string | undefined) => {
    const open = rows.expanded === key;
    return (
      <div {...rows.rowProps(key)} className="border-t border-line py-2.5 first:border-t-0">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => rows.toggleHead(key)}
          className={cn("mb-1.5 block w-full text-left text-xs font-semibold", rows.pinned === key ? "text-primary" : "text-ink-soft")}
        >
          {label}
        </button>
        <Fold open={open}>{full}</Fold>
        <Fold open={!open}>
          {summary ? <span className={cn(chipClass(true), "inline-block max-w-full truncate align-top")}>{summary}</span> : <p className="text-sm text-ink-muted">Tất cả</p>}
        </Fold>
      </div>
    );
  };

  const tagChips = (kind: TagKind) => {
    const general = tagsOf[kind].filter((tag) => !tag.organizerId);
    const own = organizerId ? tagsOf[kind].filter((tag) => tag.organizerId === organizerId) : [];
    const list = (tags: FilterTag[], isOwn: boolean) => (
      <div className="flex flex-wrap gap-1.5 p-px pb-1">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            aria-pressed={selectedOf[kind] === tag.id}
            className={chipClass(selectedOf[kind] === tag.id, isOwn)}
            onClick={() => {
              pickTag(kind, tag);
              rows.pin(kind);
            }}
          >
            {tag.name}
          </button>
        ))}
      </div>
    );

    return (
      <>
        {list(general, false)}
        {own.length > 0 && (
          <>
            <p className="mb-1 mt-2 text-xs font-semibold text-gold-deep">Riêng của {shop?.name}</p>
            {list(own, true)}
          </>
        )}
      </>
    );
  };

  const foldedQuery = foldText(query.trim());

  return (
    <section aria-label="Bộ lọc" className="min-w-0 rounded-card border border-line bg-card px-4 py-3 shadow-card lg:sticky lg:top-36">
      <div className="mb-1 flex items-center gap-3">
        <h2 className="mr-auto whitespace-nowrap text-sm font-bold text-ink">Bạn đang tìm</h2>
        {hasFilter && (
          <button
            type="button"
            className="shrink-0 whitespace-nowrap text-xs font-semibold text-primary hover:underline"
            onClick={() => onChange({ organizerId: "", brand: "", categoryId: "", fillingId: "" })}
          >
            Xóa lọc
          </button>
        )}
        <button
          type="button"
          aria-pressed={searching}
          aria-label="Tìm nhãn"
          title="Tìm nhãn"
          onClick={toggleSearch}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border transition",
            searching ? "border-primary bg-primary text-white" : "border-line text-ink-soft hover:border-primary hover:text-primary",
          )}
        >
          <Search size={15} />
        </button>
      </div>

      <Fold open={!searching}>
        {row(
          "shop",
          "Hãng",
          <div className="flex flex-wrap gap-1.5 p-px pb-1">
            {shops.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={organizerId === item.id}
                className={chipClass(organizerId === item.id)}
                onClick={() => {
                  pickShop(item);
                  rows.pin("shop");
                }}
              >
                {item.name}
              </button>
            ))}
          </div>,
          shop?.name,
        )}
        {row("category", KIND_LABEL.category, tagChips("category"), categories.find((tag) => tag.id === categoryId)?.name)}
        {row("filling", KIND_LABEL.filling, tagChips("filling"), fillings.find((tag) => tag.id === fillingId)?.name)}
      </Fold>

      <Fold open={searching}>
        <div className="p-px">
          <div
            className="mb-2 mt-2 flex items-center gap-2 rounded-lg border border-line bg-card/70 px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
            onKeyDown={(event) => {
              if (event.key === "Escape") setSearching(false);
            }}
          >
            <Search size={14} className="shrink-0 text-ink-muted" />
            <Autocomplete
              ref={searchRef}
              freeText
              filterOptions
              hideList
              ariaLabel="Tìm nhãn"
              placeholder="Tìm nhãn của mọi hãng"
              tabIndex={searching ? 0 : -1}
              options={tagOptions}
              text={query}
              onTextChange={setQuery}
              onPick={(option) => option && setQuery(option.name)}
              onSubmit={setQuery}
              className="min-w-0 flex-1"
              inputClassName="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
              ghostClassName="text-sm"
            />
          </div>

          {searching && (hits.length > 0 ? (
            <div className="lb-scrollbar grid max-h-64 gap-1.5 overflow-y-auto pb-1">
              {hits.map(({ kind, tag }) => {
                const active = selectedOf[kind] === tag.id;
                return (
                  <button
                    key={`${kind}-${tag.id}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pickTag(kind, tag)}
                    className={cn(
                      "min-w-0 rounded-lg border px-2.5 py-1.5 text-left transition",
                      active ? "border-primary bg-primary text-white" : "border-line bg-card hover:border-primary",
                    )}
                  >
                    <span className="block break-words text-sm font-semibold">
                      <Highlight text={tag.name} query={foldedQuery} />
                    </span>
                    <span className={cn("block break-words text-xs", active ? "text-primary-soft" : "text-ink-muted")}>
                      {KIND_LABEL[kind]} · {tag.organizerBrandName ?? "Nhãn chung"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="pb-2 text-sm text-ink-muted">Không có nhãn khớp</p>
          ))}
        </div>
      </Fold>
    </section>
  );
}
