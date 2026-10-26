"use client";

import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon, TerminalIcon, Trash2Icon, XIcon } from "lucide-react";

import type { ReferenceCategoryRow } from "@/db/schema";
import type { ReferenceDto } from "@/features/references/data";
import { AddReferenceDialog, DeleteReferenceDialog } from "@/features/references/reference-dialogs";

export function ReferenceCatalog({
  categories,
  images,
}: {
  categories: ReferenceCategoryRow[];
  images: ReferenceDto[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ReferenceDto | null>(null);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return images.filter((image) =>
      (category === "all" || image.categorySlug === category) &&
      (!search || [image.label, image.categoryLabel, ...image.tags].join(" ").toLowerCase().includes(search))
    );
  }, [category, images, query]);
  const counts = useMemo(() => new Map(categories.map((item) => [item.slug, images.filter((image) => image.categorySlug === item.slug).length])), [categories, images]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--atlas-border)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-muted)" }}>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center" style={{ borderRadius: "var(--atlas-radius)", background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}><TerminalIcon className="size-4" /></span>
          <div>
            <p className="text-sm font-bold">Add here or through the Atlas CLI</p>
            <p className="atlas-muted mt-0.5 text-sm">Add and delete references here; categories stay agent-managed.</p>
          </div>
        </div>
        <button className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold text-white" onClick={() => setAdding(true)} style={{ background: "var(--atlas-accent)" }} type="button"><PlusIcon className="size-4" />Add reference</button>
      </div>

      <div className="mb-5 flex flex-col gap-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 atlas-muted" />
          <input aria-label="Search references" className="atlas-search-field" onChange={(event) => setQuery(event.target.value)} placeholder="Search references by label or tag" style={{ paddingLeft: 36, paddingRight: 40 }} value={query} />
          {query ? <button aria-label="Clear search" className="atlas-icon-button absolute right-1.5 top-1/2 -translate-y-1/2" onClick={() => setQuery("")} type="button"><XIcon /></button> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <CategoryPill active={category === "all"} count={images.length} label="All" onClick={() => setCategory("all")} />
          {categories.map((item) => <CategoryPill active={category === item.slug} count={counts.get(item.slug) ?? 0} key={item.id} label={item.label} onClick={() => setCategory(item.slug)} />)}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="atlas-file-tile atlas-empty-tile"><strong>No references found</strong><span className="atlas-muted">Try another category, label, or tag.</span></div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((image) => (
            <article className="min-w-0 overflow-hidden border" key={image.id} style={{ borderColor: "var(--atlas-border)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-surface)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={image.label} className="aspect-4/3 w-full object-contain" src={image.url} style={{ background: "var(--atlas-bg-muted)" }} />
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <strong className="block min-w-0 break-words text-sm">{image.label}</strong>
                  <button aria-label={`Delete ${image.label}`} className="atlas-icon-button -mr-1.5 -mt-1.5 size-7 shrink-0" onClick={() => setDeleting(image)} type="button"><Trash2Icon /></button>
                </div>
                <span className="atlas-muted mt-1 block text-xs">{image.categoryLabel}</span>
                {image.tags.length ? <div className="mt-2 flex flex-wrap gap-1">{image.tags.map((tag) => <span className="rounded-full border px-2 py-0.5 text-[11px]" key={tag}>{tag}</span>)}</div> : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {adding ? <AddReferenceDialog categories={categories} onClose={() => setAdding(false)} /> : null}
      {deleting ? <DeleteReferenceDialog image={deleting} onClose={() => setDeleting(null)} /> : null}
    </>
  );
}

function CategoryPill({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return <button aria-pressed={active} className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold" onClick={onClick} style={{ borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)", background: active ? "var(--atlas-accent)" : "var(--atlas-bg-surface)", color: active ? "#fff" : "var(--atlas-text-secondary)" }} type="button">{label}<span className="opacity-70">{count}</span></button>;
}
