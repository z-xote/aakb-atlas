"use client";

import { useMemo, useState } from "react";
import { PencilIcon, PlusIcon, SearchIcon, TerminalIcon, Trash2Icon, XIcon } from "lucide-react";

import type { ReferenceCategoryRow } from "@/db/schema";
import type { ReferenceDto } from "@/features/references/data";
import { CategoryRenameDialog, DeleteReferenceDialog, ReferenceFormDialog } from "@/features/references/reference-dialogs";

export function ReferenceCatalog({
  categories,
  images,
}: {
  categories: ReferenceCategoryRow[];
  images: ReferenceDto[];
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ReferenceDto | null>(null);
  const [deleting, setDeleting] = useState<ReferenceDto | null>(null);
  const [renaming, setRenaming] = useState<ReferenceCategoryRow | null>(null);
  // Filter by id so a rename keeps the filter; a category removed with its last reference falls back to All.
  const active = categories.find((item) => item.id === categoryId) ?? null;
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return images.filter((image) =>
      (!active || image.categoryId === active.id) &&
      (!search || [image.label, image.categoryLabel, ...image.tags].join(" ").toLowerCase().includes(search))
    );
  }, [active, images, query]);
  const counts = useMemo(() => new Map(categories.map((item) => [item.id, images.filter((image) => image.categoryId === item.id).length])), [categories, images]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--atlas-border)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-muted)" }}>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center" style={{ borderRadius: "var(--atlas-radius)", background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}><TerminalIcon className="size-4" /></span>
          <div>
            <p className="text-sm font-bold">Add here or through the Atlas CLI</p>
            <p className="atlas-muted mt-0.5 text-sm">Add, edit and delete references and categories here, or let an agent do it.</p>
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
        <div className="flex flex-wrap items-center gap-2">
          <CategoryPill active={!active} count={images.length} label="All" onClick={() => setCategoryId("all")} />
          {categories.map((item) => <CategoryPill active={active?.id === item.id} count={counts.get(item.id) ?? 0} key={item.id} label={item.label} onClick={() => setCategoryId(item.id)} />)}
          {active ? <button aria-label={`Rename ${active.label}`} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-bold" onClick={() => setRenaming(active)} style={{ color: "var(--atlas-text-secondary)" }} type="button"><PencilIcon className="size-3.5" />Rename</button> : null}
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
                  <div className="-mr-1.5 -mt-1.5 flex shrink-0">
                    <button aria-label={`Edit ${image.label}`} className="atlas-icon-button size-7" onClick={() => setEditing(image)} type="button"><PencilIcon /></button>
                    <button aria-label={`Delete ${image.label}`} className="atlas-icon-button size-7" onClick={() => setDeleting(image)} type="button"><Trash2Icon /></button>
                  </div>
                </div>
                <span className="atlas-muted mt-1 block text-xs">{image.categoryLabel}</span>
                {image.tags.length ? <div className="mt-2 flex flex-wrap gap-1">{image.tags.map((tag) => <span className="rounded-full border px-2 py-0.5 text-[11px]" key={tag}>{tag}</span>)}</div> : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {adding ? <ReferenceFormDialog categories={categories} onClose={() => setAdding(false)} /> : null}
      {editing ? <ReferenceFormDialog categories={categories} image={editing} key={editing.id} onClose={() => setEditing(null)} /> : null}
      {deleting ? <DeleteReferenceDialog image={deleting} lastInCategory={counts.get(deleting.categoryId) === 1} onClose={() => setDeleting(null)} /> : null}
      {renaming ? <CategoryRenameDialog category={renaming} onClose={() => setRenaming(null)} /> : null}
    </>
  );
}

function CategoryPill({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return <button aria-pressed={active} className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold" onClick={onClick} style={{ borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)", background: active ? "var(--atlas-accent)" : "var(--atlas-bg-surface)", color: active ? "#fff" : "var(--atlas-text-secondary)" }} type="button">{label}<span className="opacity-70">{count}</span></button>;
}
