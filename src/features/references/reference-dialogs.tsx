"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";

import type { ReferenceCategoryRow } from "@/db/schema";
import type { ReferenceDto } from "@/features/references/data";

const fieldStyle = { borderColor: "var(--atlas-border-strong)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-muted)" };

async function send(url: string, init: RequestInit) {
  try {
    const response = await fetch(url, init);
    const body = await response.json() as { ok: boolean; error?: { message?: string } };
    return response.ok && body.ok ? null : body.error?.message ?? "Atlas could not complete the request.";
  } catch {
    return "Atlas could not reach the server. Try again.";
  }
}

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);
  return (
    <dialog aria-label={title} className="m-auto w-[min(440px,calc(100vw-32px))] border p-0 backdrop:bg-black/40" onClose={onClose} ref={ref} style={{ borderColor: "var(--atlas-border)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-surface)", color: "var(--atlas-text-primary)" }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--atlas-border)" }}>
        <h2 className="text-base font-bold">{title}</h2>
        <button aria-label="Close" className="atlas-icon-button" onClick={onClose} type="button"><XIcon /></button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  );
}

function Actions({ busy, confirm, danger, onCancel }: { busy: boolean; confirm: string; danger?: boolean; onCancel: () => void }) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button className="h-9 rounded-lg border px-3 text-sm font-bold" disabled={busy} onClick={onCancel} style={{ borderColor: "var(--atlas-border)" }} type="button">Cancel</button>
      <button className="h-9 rounded-lg px-3 text-sm font-bold text-white disabled:opacity-50" disabled={busy} style={{ background: danger ? "var(--destructive)" : "var(--atlas-accent)" }} type="submit">{busy ? "Working…" : confirm}</button>
    </div>
  );
}

function ErrorText({ message }: { message: string }) {
  return message ? <p className="mt-3 text-sm" role="alert" style={{ color: "var(--destructive)" }}>{message}</p> : null;
}

export function AddReferenceDialog({ categories, onClose }: { categories: ReferenceCategoryRow[]; onClose: () => void }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const failure = await send("/api/references", { method: "POST", body: new FormData(event.currentTarget) });
    setBusy(false);
    if (failure) return setError(failure);
    router.refresh();
    onClose();
  }

  return (
    <Modal onClose={onClose} title="Add reference">
      {categories.length === 0 ? (
        <p className="atlas-muted text-sm">There are no reference categories yet. Create one with <code>atlas references categories create</code> first.</p>
      ) : (
        <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
          <label className="grid gap-1.5"><span className="atlas-label">Image</span><input accept="image/*" className="text-sm" name="image" onChange={(event) => { const name = event.target.files?.[0]?.name; if (name && !label) setLabel(name.replace(/\.[^.]+$/, "").slice(0, 120)); }} required type="file" /></label>
          <label className="grid gap-1.5"><span className="atlas-label">Label</span><input className="h-10 w-full border px-3 text-sm outline-none" maxLength={120} name="label" onChange={(event) => setLabel(event.target.value)} required style={fieldStyle} value={label} /></label>
          <label className="grid gap-1.5"><span className="atlas-label">Category</span><select className="h-10 w-full border px-3 text-sm outline-none" defaultValue={categories[0]?.slug} name="category" required style={fieldStyle}>{categories.map((item) => <option key={item.id} value={item.slug}>{item.label}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="atlas-label">Tags</span><input className="h-10 w-full border px-3 text-sm outline-none" maxLength={500} name="tags" placeholder="oak, matte, floating" style={fieldStyle} /></label>
          <p className="atlas-muted text-xs">Images up to 12 MB. Separate tags with commas.</p>
          <ErrorText message={error} />
          <Actions busy={busy} confirm="Add reference" onCancel={onClose} />
        </form>
      )}
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
    const failure = await send(`/api/references/${encodeURIComponent(image.id)}`, { method: "DELETE" });
    setBusy(false);
    if (failure) return setError(failure);
    router.refresh();
    onClose();
  }

  return (
    <Modal onClose={onClose} title="Delete reference">
      <form onSubmit={(event) => void submit(event)}>
        <p className="text-sm">Delete <strong>“{image.label}”</strong> from {image.categoryLabel}? Its stored image is removed too. This cannot be undone.</p>
        <ErrorText message={error} />
        <Actions busy={busy} confirm="Delete" danger onCancel={onClose} />
      </form>
    </Modal>
  );
}
