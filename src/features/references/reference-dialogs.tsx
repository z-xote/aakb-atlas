"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ImagePlusIcon, PlusIcon, XIcon } from "lucide-react";

import type { ReferenceCategoryRow } from "@/db/schema";
import type { ReferenceDto } from "@/features/references/data";
import { TagChip } from "@/features/files/components/image-primitives";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const fieldStyle = { borderColor: "var(--atlas-border-strong)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-muted)" };

async function send<T>(url: string, init: RequestInit): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const response = await fetch(url, init);
    const body = await response.json() as { ok: boolean; data: T; error?: { message?: string } };
    return response.ok && body.ok ? { data: body.data, error: null } : { data: null, error: body.error?.message ?? "Atlas could not complete the request." };
  } catch {
    return { data: null, error: "Atlas could not reach the server. Try again." };
  }
}

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);
  return (
    <dialog aria-label={title} className="m-auto max-h-[calc(100dvh-32px)] w-[min(520px,calc(100vw-32px))] overflow-y-auto border p-0 backdrop:bg-black/50" onClose={onClose} ref={ref} style={{ borderColor: "var(--atlas-border)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-surface)", color: "var(--atlas-text-primary)" }}>
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5" style={{ borderColor: "var(--atlas-border)" }}>
        <h2 className="text-base font-bold">{title}</h2>
        <button aria-label="Close" className="atlas-icon-button" onClick={onClose} type="button"><XIcon /></button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

function ErrorText({ message }: { message: string }) {
  return message ? <p className="text-sm font-bold" role="alert" style={{ color: "var(--destructive)" }}>{message}</p> : null;
}

function ImageDrop({ currentUrl, file, onError, onFile }: { currentUrl?: string; file: File | null; onError: (message: string) => void; onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const shown = preview ?? currentUrl;

  function pick(next: File | undefined) {
    if (!next) return;
    if (!next.type.startsWith("image/")) return onError("Choose an image file.");
    if (next.size > MAX_IMAGE_BYTES) return onError("Reference images must be 12 MB or smaller.");
    onError("");
    onFile(next);
  }

  return (
    <div className="grid gap-1.5">
      <button
        aria-label={shown ? "Replace image" : "Choose an image"}
        className="group relative grid h-52 w-full place-items-center overflow-hidden border-2 border-dashed text-center"
        onClick={() => inputRef.current?.click()}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); pick(event.dataTransfer.files[0]); }}
        style={{ borderColor: dragging ? "var(--atlas-accent)" : "var(--atlas-border-strong)", borderRadius: "var(--atlas-radius)", background: dragging ? "var(--atlas-accent-soft)" : "var(--atlas-bg-muted)" }}
        type="button"
      >
        {shown ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="absolute inset-0 size-full object-contain" src={shown} />
            <span className="absolute bottom-2 right-2 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-white opacity-90 group-hover:opacity-100" style={{ background: "rgba(0,0,0,.65)" }}><ImagePlusIcon className="size-3.5" />Replace image</span>
          </>
        ) : (
          <span className="grid justify-items-center gap-2 px-4">
            <span className="grid size-11 place-items-center rounded-full" style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}><ImagePlusIcon className="size-5" /></span>
            <span className="text-sm font-bold">Drop an image here or click to choose</span>
            <span className="atlas-muted text-xs">JPEG, PNG, WebP or HEIC, up to 12 MB</span>
          </span>
        )}
      </button>
      {file ? <span className="atlas-muted truncate text-xs">{file.name} · {file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`}</span> : null}
      <input accept="image/*" className="hidden" onChange={(event) => { pick(event.target.files?.[0]); event.target.value = ""; }} ref={inputRef} type="file" />
    </div>
  );
}

function CategoryPicker({ categories, onCreated, onSelect, selected }: { categories: ReferenceCategoryRow[]; onCreated: (category: ReferenceCategoryRow) => void; onSelect: (slug: string) => void; selected: string }) {
  const [creating, setCreating] = useState(categories.length === 0);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    const result = await send<ReferenceCategoryRow>("/api/references/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: name.trim() }) });
    setBusy(false);
    if (result.error !== null) return setError(result.error);
    onCreated(result.data);
    setName("");
    setError("");
    setCreating(false);
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
        {categories.map((item) => {
          const active = item.slug === selected;
          return <button aria-checked={active} className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold" key={item.id} onClick={() => onSelect(item.slug)} role="radio" style={{ borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)", background: active ? "var(--atlas-accent)" : "var(--atlas-bg-surface)", color: active ? "#fff" : "var(--atlas-text-secondary)" }} type="button">{active ? <CheckIcon className="size-3.5" /> : null}{item.label}</button>;
        })}
        {creating ? null : <button className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed px-3 text-xs font-bold" onClick={() => setCreating(true)} style={{ borderColor: "var(--atlas-border-strong)", color: "var(--atlas-text-secondary)" }} type="button"><PlusIcon className="size-3.5" />New category</button>}
      </div>
      {creating ? (
        <div className="flex items-center gap-2">
          <input aria-label="New category name" autoFocus className="h-9 min-w-0 flex-1 border px-3 text-sm outline-none" maxLength={80} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void create(); } }} placeholder="New category, e.g. Shower screens" style={fieldStyle} value={name} />
          <button className="atlas-btn atlas-btn-primary h-9 px-3" disabled={busy || !name.trim()} onClick={() => void create()} type="button">{busy ? "Adding…" : "Add"}</button>
          {categories.length ? <button aria-label="Cancel new category" className="atlas-icon-button" onClick={() => { setCreating(false); setName(""); setError(""); }} type="button"><XIcon /></button> : null}
        </div>
      ) : null}
      <ErrorText message={error} />
    </div>
  );
}

function TagInput({ draft, onDraft, onTags, tags }: { draft: string; onDraft: (value: string) => void; onTags: (tags: string[]) => void; tags: string[] }) {
  function commit(value: string) {
    const added = value.split(",").map((tag) => tag.trim()).filter((tag) => tag && !tags.includes(tag));
    if (added.length) onTags([...tags, ...new Set(added)]);
    onDraft("");
  }
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 border px-2 py-1.5" style={fieldStyle}>
      {tags.map((tag) => <TagChip key={tag} onRemove={() => onTags(tags.filter((item) => item !== tag))}>{tag}</TagChip>)}
      <input
        aria-label="Add a tag"
        className="h-7 min-w-28 flex-1 bg-transparent px-1 text-sm outline-none"
        onBlur={() => commit(draft)}
        onChange={(event) => (event.target.value.includes(",") ? commit(event.target.value) : onDraft(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === "Enter") { event.preventDefault(); commit(draft); }
          if (event.key === "Backspace" && !draft && tags.length) onTags(tags.slice(0, -1));
        }}
        placeholder={tags.length ? "Add another" : "Type a tag, press Enter"}
        value={draft}
      />
    </div>
  );
}

export function ReferenceFormDialog({ categories, image, onClose }: { categories: ReferenceCategoryRow[]; image?: ReferenceDto; onClose: () => void }) {
  const router = useRouter();
  const [options, setOptions] = useState(categories);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState(image?.label ?? "");
  const [category, setCategory] = useState(image?.categorySlug ?? categories[0]?.slug ?? "");
  const [tags, setTags] = useState(image?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!image && !file) return setError("Choose an image first.");
    if (!category) return setError("Pick or create a category.");
    const form = new FormData();
    form.set("label", label.trim());
    form.set("category", category);
    form.set("tags", [...tags, tagDraft].join(","));
    if (file) form.set("image", file);
    setBusy(true);
    setError("");
    const result = await send(image ? `/api/references/${encodeURIComponent(image.id)}` : "/api/references", { method: image ? "PATCH" : "POST", body: form });
    setBusy(false);
    if (result.error !== null) return setError(result.error);
    router.refresh();
    onClose();
  }

  return (
    <Modal onClose={onClose} title={image ? "Edit reference" : "Add reference"}>
      <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
        <ImageDrop currentUrl={image?.url} file={file} onError={setError} onFile={(next) => { setFile(next); if (!label) setLabel(next.name.replace(/\.[^.]+$/, "").slice(0, 120)); }} />
        <label className="grid gap-1.5"><span className="atlas-label">Label</span><input className="h-10 w-full border px-3 text-sm outline-none" maxLength={120} onChange={(event) => setLabel(event.target.value)} placeholder="Floating oak vanity" required style={fieldStyle} value={label} /></label>
        <div className="grid gap-1.5"><span className="atlas-label">Category</span><CategoryPicker categories={options} onCreated={(created) => { setOptions((current) => [...current, created]); setCategory(created.slug); router.refresh(); }} onSelect={setCategory} selected={category} /></div>
        <div className="grid gap-1.5"><span className="atlas-label">Tags</span><TagInput draft={tagDraft} onDraft={setTagDraft} onTags={setTags} tags={tags} /></div>
        <ErrorText message={error} />
        <div className="flex justify-end gap-2">
          <button className="atlas-btn atlas-btn-outline h-10 px-4" disabled={busy} onClick={onClose} type="button">Cancel</button>
          <button className="atlas-btn atlas-btn-primary h-10 px-4" disabled={busy} type="submit">{busy ? "Saving…" : image ? "Save changes" : "Add reference"}</button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteReferenceDialog({ image, onClose }: { image: ReferenceDto; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await send(`/api/references/${encodeURIComponent(image.id)}`, { method: "DELETE" });
    setBusy(false);
    if (result.error !== null) return setError(result.error);
    router.refresh();
    onClose();
  }

  return (
    <Modal onClose={onClose} title="Delete reference">
      <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
        <p className="text-sm">Delete <strong>“{image.label}”</strong> from {image.categoryLabel}? Its stored image is removed too. This cannot be undone.</p>
        <ErrorText message={error} />
        <div className="flex justify-end gap-2">
          <button className="atlas-btn atlas-btn-outline h-10 px-4" disabled={busy} onClick={onClose} type="button">Cancel</button>
          <button className="atlas-btn h-10 px-4 text-white" disabled={busy} style={{ background: "var(--destructive)" }} type="submit">{busy ? "Deleting…" : "Delete"}</button>
        </div>
      </form>
    </Modal>
  );
}
