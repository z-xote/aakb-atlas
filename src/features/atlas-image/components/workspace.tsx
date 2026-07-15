"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeftIcon, CheckIcon, LoaderCircleIcon, MicIcon, PlusIcon, RefreshCwIcon, SendHorizontalIcon, SparklesIcon, SquareIcon, XIcon } from "lucide-react";

import type { DirectionSnapshot } from "@/features/atlas-image/data";
import { AtlasBottomActions } from "@/features/files/components/file-ui";
import type { FileAssetDto } from "@/features/files/data";
import type { ReferenceDto } from "@/features/references/data";
import type { AtlasImageQuality } from "@/types/atlas";
import { transcriptionToComposerDraft } from "@/features/atlas-image/schemas";
import { AtlasImageGenerationProgress } from "@/features/atlas-image/components/generation-progress";

function TranscriptionProgress() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid gap-2.5 rounded-lg border p-3"
      role="status"
      style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}>
          <MicIcon className="size-4 animate-pulse" />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm">Transcribing audio…</strong>
          <span className="block text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>Preparing an editable direction draft</span>
        </span>
      </div>
      <div
        aria-label="Audio transcription in progress"
        className="h-1.5 overflow-hidden rounded-full"
        role="progressbar"
        style={{ background: "var(--atlas-bg-hover)" }}
      >
        <span className="atlas-transcription-progress-bar block h-full w-2/5 rounded-full" style={{ background: "var(--atlas-accent)" }} />
      </div>
    </div>
  );
}

export function AtlasImageWorkspace({
  fileId,
  sessionId,
  source,
  initialDirections,
  initialReferenceIds,
  references,
  defaultQuality,
}: {
  fileId: string;
  sessionId: string;
  source: FileAssetDto;
  initialDirections: DirectionSnapshot[];
  initialReferenceIds: string[];
  references: ReferenceDto[];
  defaultQuality: AtlasImageQuality;
}) {
  const router = useRouter();
  const [directions, setDirections] = useState(initialDirections);
  const [availableReferences, setAvailableReferences] = useState(references);
  const [selected, setSelected] = useState(initialReferenceIds);
  const [category, setCategory] = useState(references[0]?.categorySlug ?? "");
  const [draft, setDraft] = useState("");
  const [quality, setQuality] = useState(defaultQuality);
  const [busy, setBusy] = useState<"" | "direction" | "references" | "uploading-reference" | "transcribing" | "generating">("");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const categories = Array.from(new Map(availableReferences.map((reference) => [reference.categorySlug, reference.categoryLabel])).entries());
  const visibleReferences = availableReferences.filter((reference) => reference.categorySlug === category);
  const selectedReferences = selected.map((id) => availableReferences.find((reference) => reference.id === id)).filter((reference): reference is ReferenceDto => Boolean(reference));

  async function addDirection() {
    const bodyText = draft.trim();
    if (!bodyText || busy) return;
    setBusy("direction");
    setError("");
    const response = await fetch(`/api/files/${fileId}/atlas-image/sessions/${sessionId}/directions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: bodyText }) });
    const body = (await response.json()) as { ok: boolean; data?: DirectionSnapshot; error?: { message?: string } };
    if (!response.ok || !body.ok || !body.data) setError(body.error?.message ?? "Atlas could not save that direction.");
    else { setDirections((current) => [...current, body.data!]); setDraft(""); }
    setBusy("");
  }

  async function toggleReference(referenceId: string) {
    if (busy) return;
    const next = selected.includes(referenceId) ? selected.filter((id) => id !== referenceId) : [...selected, referenceId];
    setSelected(next);
    setBusy("references");
    const response = await fetch(`/api/files/${fileId}/atlas-image/sessions/${sessionId}/references`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ referenceIds: next }) });
    if (!response.ok) { setSelected(selected); setError("Atlas could not save the reference order."); }
    setBusy("");
  }

  async function uploadReference(file: File) {
    if (busy) return;
    setBusy("uploading-reference");
    setError("");
    try {
      const form = new FormData();
      form.set("image", file);
      const response = await fetch(`/api/files/${fileId}/atlas-image/sessions/${sessionId}/references/upload`, { method: "POST", body: form });
      const body = (await response.json()) as { ok: boolean; data?: { reference?: ReferenceDto; referenceIds?: string[] }; error?: { message?: string } };
      const reference = body.data?.reference;
      if (!response.ok || !body.ok || !reference) {
        setError(body.error?.message ?? "Atlas could not upload that reference image.");
        return;
      }
      setAvailableReferences((current) => current.some((item) => item.id === reference.id) ? current : [...current, reference]);
      setSelected(body.data?.referenceIds ?? [...selected, reference.id]);
      setCategory(reference.categorySlug);
    } catch {
      setError("Atlas could not reach Bunny to upload that reference image.");
    } finally {
      setBusy("");
    }
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("Voice recording is not available in this browser."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => void transcribeRecording(recorder.mimeType || "audio/webm");
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch { setError("Microphone access was blocked. Allow it in the browser controls and try again."); }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    setBusy("transcribing");
    recorder.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRecording(false);
  }

  async function transcribeRecording(contentType: string) {
    setBusy("transcribing");
    setError("");
    try {
      const blob = new Blob(chunksRef.current, { type: contentType });
      const form = new FormData();
      form.set("audio", new File([blob], "direction.webm", { type: contentType }));
      const response = await fetch(`/api/files/${fileId}/atlas-image/transcriptions`, { method: "POST", body: form });
      const body = (await response.json()) as { ok: boolean; data?: { text?: string }; error?: { message?: string } };
      if (!response.ok || !body.ok || !body.data?.text) setError(body.error?.message ?? "Atlas could not transcribe that recording.");
      else setDraft(transcriptionToComposerDraft(body.data.text));
    } catch {
      setError("Atlas could not reach the transcription service. Try recording again.");
    } finally {
      setBusy("");
    }
  }

  async function generate() {
    if (!directions.length || busy) return;
    setBusy("generating");
    setError("");
    const response = await fetch(`/api/files/${fileId}/atlas-image/generations`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, clientRequestId: crypto.randomUUID(), quality }) });
    const body = (await response.json()) as { ok: boolean; data?: { id?: string }; error?: { message?: string } };
    if (!response.ok || !body.ok || !body.data?.id) { setError(body.error?.message ?? "Atlas could not start generation."); setBusy(""); return; }
    router.push(`/files/${fileId}/pipelines/atlas-image/generations/${body.data.id}`);
    router.refresh();
  }

  if (busy === "generating") {
    return (
      <>
        <main className="atlas-frame flex flex-1 flex-col justify-center py-6">
          <AtlasImageGenerationProgress directions={directions} quality={quality} references={selectedReferences} source={source} />
        </main>
        <AtlasBottomActions label="Atlas Image generation progress actions">
          <Link className="atlas-bottom-nav-item" href={`/files/${fileId}/pipelines/atlas-image`}><ArrowLeftIcon className="size-4" />View history</Link>
          <button aria-busy="true" className="atlas-bottom-nav-item atlas-active" disabled type="button"><SparklesIcon className="size-4 animate-pulse" />Generating one concept…</button>
        </AtlasBottomActions>
      </>
    );
  }

  return (
    <>
      <main className="atlas-frame flex flex-1 flex-col gap-4 py-6">
        <div className="grid min-h-[560px] flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <section className="atlas-simple-panel flex min-h-0 flex-col">
            <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--atlas-border)" }}>
              <div className="relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-lg"><Image alt={source.label} className="object-cover" fill sizes="112px" src={source.url} unoptimized /></div>
              <div className="min-w-0 flex-1"><span className="atlas-label">Editing source</span><p className="truncate text-sm font-bold">{source.label}</p><p className="truncate text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>{source.kind === "ai_generated" ? "Previous Atlas Image output" : "File site photo"}</p></div>
              <Link className="atlas-btn atlas-btn-outline shrink-0" href={`/files/${fileId}/pipelines/atlas-image/new`}><RefreshCwIcon />Change source</Link>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <span className="atlas-label">Direction log · user entries only</span>
              {directions.length ? directions.map((direction, index) => (
                <div className="flex justify-end" key={direction.id}><div className="max-w-[88%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm" style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-text-primary)" }}><span className="mb-1 block text-[10px] font-bold uppercase" style={{ color: "var(--atlas-accent)" }}>Direction {index + 1} · saved</span>{direction.body}</div></div>
              )) : <div className="grid flex-1 place-items-center rounded-lg border border-dashed p-6 text-center text-sm" style={{ borderColor: "var(--atlas-border-strong)", color: "var(--atlas-text-tertiary)" }}>Add the first direction below. Once added, it stays immutable; corrections become a new entry.</div>}
            </div>
            <div className="border-t p-3" style={{ borderColor: "var(--atlas-border)" }}>
              {recording ? <div className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: "var(--destructive)", background: "var(--atlas-bg-muted)" }}><span className="size-2.5 animate-pulse rounded-full" style={{ background: "var(--destructive)" }} /><strong className="flex-1 text-sm">Recording direction…</strong><button className="atlas-btn text-white" onClick={stopRecording} style={{ background: "var(--destructive)" }} type="button"><SquareIcon className="size-3" fill="currentColor" />Stop</button></div> : busy === "transcribing" ? <TranscriptionProgress /> : (
                <div className="flex items-end gap-2 rounded-lg border p-2" style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}>
                  <input accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadReference(file); }} ref={uploadInputRef} type="file" />
                  <button aria-label="Add image reference" className="atlas-icon-button atlas-icon-button-bordered size-10! shrink-0" disabled={Boolean(busy)} onClick={() => uploadInputRef.current?.click()} title="Choose an optional image reference" type="button">{busy === "uploading-reference" ? <LoaderCircleIcon className="animate-spin" /> : <PlusIcon />}</button>
                  <textarea className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" onChange={(event) => setDraft(event.target.value)} placeholder="Describe the change, or tap the mic…" value={draft} />
                  <button aria-label="Record voice direction" className="atlas-icon-button atlas-icon-button-bordered size-10! shrink-0" disabled={Boolean(busy)} onClick={() => void startRecording()} type="button"><MicIcon /></button>
                  <button aria-label="Add direction" className="grid size-10 shrink-0 place-items-center rounded-lg text-white disabled:opacity-40" disabled={!draft.trim() || Boolean(busy)} onClick={() => void addDirection()} style={{ background: "var(--atlas-accent)" }} type="button"><SendHorizontalIcon className="size-4" /></button>
                </div>
              )}
              <p className="mt-2 text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>{busy === "uploading-reference" ? "Uploading and attaching the image reference…" : "The + adds an optional image reference. Voice returns an editable draft and is never submitted automatically."}</p>
            </div>
          </section>

          <section className="atlas-simple-panel flex min-h-0 flex-col">
            <div className="atlas-no-scrollbar flex gap-1.5 overflow-x-auto border-b px-3 py-2.5" style={{ borderColor: "var(--atlas-border)" }}>{categories.map(([slug, label]) => <button className="h-8 shrink-0 rounded-full border px-3 text-xs font-bold" key={slug} onClick={() => setCategory(slug)} style={{ borderColor: category === slug ? "var(--atlas-accent)" : "var(--atlas-border)", background: category === slug ? "var(--atlas-accent-soft)" : "var(--atlas-bg-surface)", color: category === slug ? "var(--atlas-accent)" : "var(--atlas-text-secondary)" }} type="button">{label}</button>)}</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3"><div className="grid grid-cols-2 gap-3">{visibleReferences.map((reference) => {
              const active = selected.includes(reference.id);
              return <button aria-pressed={active} className="relative overflow-hidden rounded-lg border text-left" key={reference.id} onClick={() => void toggleReference(reference.id)} style={{ borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)", boxShadow: active ? "0 0 0 2px var(--atlas-accent)" : "none", background: "var(--atlas-bg-muted)" }} type="button"><div className="relative aspect-4/3"><Image alt={reference.label} className="object-cover" fill sizes="25vw" src={reference.url} unoptimized />{active ? <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full text-white" style={{ background: "var(--atlas-accent)" }}><CheckIcon className="size-3.5" /></span> : null}</div><span className="block truncate p-2 text-xs font-bold">{reference.label}</span></button>;
            })}</div></div>
            <div className="border-t p-3" style={{ borderColor: "var(--atlas-border)" }}><div className="mb-2 flex items-center justify-between"><span className="atlas-label">{selected.length} selected · ordered</span><span className="text-[11px] font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>Optional</span></div><div className="flex min-h-12 gap-2 overflow-x-auto">{selectedReferences.length ? selectedReferences.map((reference, index) => <div className="relative w-12 shrink-0" key={reference.id}><div className="relative aspect-square overflow-hidden rounded-md"><Image alt={reference.label} className="object-cover" fill sizes="48px" src={reference.url} unoptimized /></div><span className="absolute bottom-0 left-0 grid size-4 place-items-center rounded-tr bg-black/70 text-[9px] font-bold text-white">{index + 1}</span><button aria-label={`Remove ${reference.label}`} className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border" onClick={() => void toggleReference(reference.id)} style={{ background: "var(--atlas-bg-surface)", borderColor: "var(--atlas-border)" }} type="button"><XIcon className="size-3" /></button></div>) : <div className="grid w-full place-items-center rounded-lg border border-dashed text-xs font-bold" style={{ borderColor: "var(--atlas-border-strong)", color: "var(--atlas-text-tertiary)" }}>No references selected</div>}</div></div>
          </section>
        </div>
        <div className="flex items-center justify-end gap-2"><span className="atlas-label">Output quality</span>{(["medium", "high"] as const).map((value) => <button aria-pressed={quality === value} className="h-8 rounded-full border px-3 text-xs font-bold capitalize" key={value} onClick={() => setQuality(value)} style={{ borderColor: quality === value ? "var(--atlas-accent)" : "var(--atlas-border)", background: quality === value ? "var(--atlas-accent-soft)" : "var(--atlas-bg-surface)", color: quality === value ? "var(--atlas-accent)" : "var(--atlas-text-secondary)" }} type="button">{value}</button>)}</div>
        {error ? <p className="atlas-login-error" role="alert">{error}</p> : null}
      </main>
      <AtlasBottomActions label="Atlas Image generation actions"><Link className="atlas-bottom-nav-item" href={`/files/${fileId}/pipelines/atlas-image`}><ArrowLeftIcon className="size-4" />Back</Link><button className="atlas-bottom-nav-item atlas-active" disabled={!directions.length || Boolean(busy)} onClick={() => void generate()} style={{ opacity: !directions.length || busy ? 0.5 : 1 }} type="button"><SparklesIcon className="size-4" />Generate concept · {quality}</button></AtlasBottomActions>
    </>
  );
}
