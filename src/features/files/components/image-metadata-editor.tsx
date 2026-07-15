"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CameraIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  LinkIcon,
  PlusIcon,
  SparklesIcon,
  TagIcon,
  TerminalIcon,
  UploadIcon,
} from "lucide-react";

import { ClockDial, TagChip } from "@/features/files/components/image-primitives";
import { ExpandableImage } from "@/features/files/components/expandable-image";
import type { FileAssetDto } from "@/features/files/data";
import { clockPositionHints, roomChoices, type ClockPosition } from "@/types/atlas";

function AgentField() {
  return <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)", color: "var(--atlas-text-tertiary)" }}><TerminalIcon className="size-3" />CLI</span>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-2"><span className="atlas-label">{children}</span><AgentField /></div>;
}

function CopyRow({ caption, value }: { caption: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <LinkIcon className="size-3.5 shrink-0" style={{ color: "var(--atlas-text-tertiary)" }} />
      <span className="flex min-w-0 flex-col leading-tight"><span className="text-[10px] font-bold uppercase" style={{ color: "var(--atlas-text-tertiary)" }}>{caption}</span><span className="truncate font-mono text-xs" title={value}>{value || "Not assigned"}</span></span>
      <button aria-label={`Copy ${caption}`} className="atlas-icon-button atlas-icon-button-bordered ml-auto size-7 shrink-0" onClick={() => { setCopied(true); void navigator.clipboard?.writeText(value); window.setTimeout(() => setCopied(false), 1400); }} type="button">{copied ? <CheckIcon style={{ color: "var(--atlas-green)" }} /> : <CopyIcon />}</button>
    </div>
  );
}

export function ImageMetadataEditor({ asset, fileId }: { asset: FileAssetDto; fileId: string }) {
  const router = useRouter();
  const knownRoom = roomChoices.includes(asset.room as (typeof roomChoices)[number]);
  const [label, setLabel] = useState(asset.label);
  const [room, setRoom] = useState(knownRoom ? asset.room ?? "" : "");
  const [customRoom, setCustomRoom] = useState(knownRoom ? "" : asset.room ?? "");
  const [customOpen, setCustomOpen] = useState(Boolean(asset.room) && !knownRoom);
  const [clock, setClock] = useState<ClockPosition | null>(asset.cameraPositionClock);
  const [tags, setTags] = useState(asset.tags);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const generated = asset.kind === "ai_generated";
  const OriginIcon = asset.origin === "camera" ? CameraIcon : asset.origin === "generated" ? SparklesIcon : UploadIcon;

  function addTag() {
    const value = newTag.trim();
    if (value && !tags.includes(value)) setTags((current) => [...current, value]);
    setNewTag("");
  }

  async function save() {
    if (!label.trim()) {
      setError("Add a label before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/files/${fileId}/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          room: (customOpen ? customRoom : room).trim() || null,
          cameraPositionClock: clock,
          tags,
        }),
      });
      const body = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Atlas could not save these details.");
        return;
      }
      router.push(`/files/${fileId}/images`);
      router.refresh();
    } catch {
      setError("Atlas could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <main className="atlas-frame py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="atlas-heading"><span className="atlas-eyebrow">Image metadata</span><h1>{asset.label}</h1></div>
          <div className="flex max-w-sm items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)", color: "var(--atlas-text-secondary)" }}><TerminalIcon className="size-4 shrink-0" style={{ color: "var(--atlas-accent)" }} />The AI agent can edit these same fields alongside you.</div>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,.92fr)]">
          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-body grid grid-cols-1 gap-4">
              {asset.url ? <ExpandableImage alt={asset.label} className="aspect-4/3 min-w-0 w-full rounded-lg" imageClassName="object-contain" overlay={<span className="absolute left-2.5 top-2.5 inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold" style={{ borderColor: generated ? "var(--atlas-accent)" : "var(--atlas-blue)", background: generated ? "var(--atlas-accent)" : "var(--atlas-blue)", color: "#fff" }}>{generated ? <SparklesIcon className="size-3" /> : <CameraIcon className="size-3" />}{generated ? "AI-generated" : "Site visit"}</span>} sizes="(max-width: 1024px) 100vw, 55vw" src={asset.url} /> : <div className="aspect-4/3 rounded-lg" style={{ background: "var(--atlas-bg-muted)" }} />}
              <div className="grid gap-2.5">
                <div className="flex items-center gap-2"><OriginIcon className="size-3.5" style={{ color: "var(--atlas-text-tertiary)" }} /><span className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>{asset.origin === "camera" ? "Captured on site" : asset.origin === "generated" ? "Created by Atlas Image" : "Uploaded from device"}</span></div>
                <div className="flex items-center gap-2"><ClockIcon className="size-3.5" style={{ color: "var(--atlas-text-tertiary)" }} /><span className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>{generated ? "Created" : "Captured"} {asset.capturedAt ? new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium", timeStyle: "short" }).format(asset.capturedAt) : "time not recorded"}</span></div>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-3 rounded-lg border p-3" style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}><span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--atlas-text-tertiary)" }}>System — read only</span><CopyRow caption="Bunny key" value={asset.storageKey} /><CopyRow caption="CDN URL" value={asset.url} /></div>
            </div>
          </section>
          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-head"><div><h2>Details</h2><p className="mt-0.5 text-sm" style={{ color: "var(--atlas-text-secondary)" }}>Optional metadata — editable any time.</p></div><span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}><TerminalIcon className="size-3.5" style={{ color: "var(--atlas-accent)" }} />Agent parity</span></div>
            <div className="atlas-simple-panel-body grid gap-5">
              <label className="grid gap-2"><FieldLabel>Label</FieldLabel><input className="h-11 w-full border px-3 text-sm outline-none" onChange={(event) => setLabel(event.target.value)} placeholder="Vanity wall" style={{ borderColor: "var(--atlas-border-strong)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-muted)" }} value={label} /></label>
              <div className="grid gap-2">
                <FieldLabel>Room / area</FieldLabel>
                <div className="flex flex-wrap gap-2">{roomChoices.map((choice) => { const active = !customOpen && room === choice; return <button aria-pressed={active} className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-bold" key={choice} onClick={() => { setRoom(choice); setCustomOpen(false); }} style={{ borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)", background: active ? "var(--atlas-accent-soft)" : "var(--atlas-bg-surface)", color: active ? "var(--atlas-accent)" : "var(--atlas-text-secondary)" }} type="button">{choice}</button>; })}<button aria-pressed={customOpen} className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold" onClick={() => { setCustomOpen(true); setRoom(""); }} type="button"><PlusIcon className="size-3.5" />Custom…</button></div>
                {customOpen ? <input autoFocus className="h-11 w-full border px-3 text-sm outline-none" onChange={(event) => setCustomRoom(event.target.value)} placeholder="e.g. Butler's pantry" style={{ borderColor: "var(--atlas-border-strong)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-muted)" }} value={customRoom} /> : null}
                <p className="text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>Optional — set it now or leave it for later.</p>
              </div>
              {generated ? (
                <div className="grid gap-3 rounded-lg border p-3" style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}><div className="flex items-center gap-2"><SparklesIcon className="size-4" style={{ color: "var(--atlas-accent)" }} /><span className="atlas-label">Generation lineage</span><span className="ml-auto text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>Milestone 3</span></div><p className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>Atlas Image history will appear here once generation is implemented.</p><Link className="atlas-btn atlas-btn-outline w-full justify-center" href={`/files/${fileId}/pipelines/atlas-image`}><ArrowUpRightIcon />Open Atlas Image handoff</Link></div>
              ) : (
                <div className="grid gap-2"><FieldLabel>Camera clock position</FieldLabel><div className="grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[auto_minmax(0,1fr)]" style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}><ClockDial onChange={setClock} size={116} value={clock} /><div><p className="text-sm font-bold">{clock ? `${clock} o'clock — ${clockPositionHints[clock]}` : "No direction set"}</p><p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--atlas-text-secondary)" }}>The door is 12 o&apos;clock. Tap a spot to record where the camera stood; tap again to clear.</p></div></div></div>
              )}
              <div className="grid gap-2"><FieldLabel>Tags</FieldLabel><div className="flex flex-wrap items-center gap-2">{tags.length ? tags.map((tag) => <TagChip key={tag} onRemove={() => setTags((current) => current.filter((item) => item !== tag))}>{tag}</TagChip>) : <span className="text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>No tags yet.</span>}</div><div className="flex items-center gap-2"><div className="relative min-w-0 flex-1"><TagIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: "var(--atlas-text-tertiary)" }} /><input className="h-11 w-full border pl-9 pr-3 text-sm outline-none" onChange={(event) => setNewTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} placeholder="Add a tag and press Enter" style={{ borderColor: "var(--atlas-border-strong)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-muted)" }} value={newTag} /></div><button className="atlas-btn atlas-btn-outline h-11 px-3" onClick={addTag} type="button"><PlusIcon />Add</button></div></div>
              {error ? <p role="alert" className="text-sm font-bold" style={{ color: "var(--destructive)" }}>{error}</p> : null}
            </div>
          </section>
        </div>
      </main>
      <div className="sticky bottom-0 z-30 border-t" style={{ borderColor: "var(--atlas-border)", background: "color-mix(in srgb, var(--atlas-bg-surface) 92%, transparent)", backdropFilter: "blur(14px)" }}><div className="atlas-frame grid grid-cols-2 items-center gap-3 py-3"><Link className="atlas-btn atlas-btn-outline h-12 w-full" href={`/files/${fileId}/images`}><ArrowLeftIcon />Back</Link><button className="atlas-btn atlas-btn-primary h-12 w-full" disabled={saving} onClick={save} type="button"><CheckIcon />{saving ? "Saving…" : "Save changes"}</button></div></div>
    </>
  );
}
