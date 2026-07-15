"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  ImageIcon,
  SparklesIcon,
  UploadCloudIcon,
  UploadIcon,
} from "lucide-react";

import { AtlasBottomActions } from "@/features/files/components/file-ui";
import type { FileAssetDto } from "@/features/files/data";
import { cn } from "@/lib/utils";

type SourceTab = "camera" | "library" | "upload";

export function AtlasImageSourceSelection({
  fileId,
  assets,
  initialSelection,
}: {
  fileId: string;
  assets: FileAssetDto[];
  initialSelection?: string;
}) {
  const router = useRouter();
  const selectedAsset = assets.find((asset) => asset.id === initialSelection) ?? null;
  const [tab, setTab] = useState<SourceTab>(selectedAsset ? "library" : "camera");
  const [selected, setSelected] = useState(selectedAsset?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const returnTo = `/files/${fileId}/pipelines/atlas-image/new`;

  async function continueToWorkspace() {
    if (!selected || pending) return;
    setPending(true);
    setError("");
    const response = await fetch(`/api/files/${fileId}/atlas-image/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceAssetId: selected }),
    });
    const body = (await response.json()) as {
      ok: boolean;
      data?: { id: string };
      error?: { message?: string };
    };
    if (!response.ok || !body.ok || !body.data) {
      setError(body.error?.message ?? "Atlas could not start this generation.");
      setPending(false);
      return;
    }
    router.push(`/files/${fileId}/pipelines/atlas-image/workspace/${body.data.id}`);
  }

  const tabs = [
    { id: "camera" as const, label: "Take Photo", hint: "Shoot a fresh before", icon: CameraIcon },
    { id: "library" as const, label: "Use Library", hint: "Reuse a file image", icon: ImageIcon },
    { id: "upload" as const, label: "Upload", hint: "Bring in a file", icon: UploadIcon },
  ];

  return (
    <>
      <section className="atlas-frame flex-1 py-6">
        <div className="atlas-heading mb-5">
          <div className="atlas-eyebrow">Atlas Image · Step 1</div>
          <h1>Choose the before image</h1>
          <p className="atlas-subtle">
            Pick exactly one structural source for this generation. Site photos and completed Atlas Image outputs are available.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tabs.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                aria-pressed={tab === entry.id}
                className={cn("atlas-image-tab", tab === entry.id && "atlas-active")}
                key={entry.id}
                onClick={() => setTab(entry.id)}
                type="button"
              >
                <Icon />
                <span><strong>{entry.label}</strong><small>{entry.hint}</small></span>
              </button>
            );
          })}
        </div>

        {tab === "camera" ? (
          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-head"><div><h2>Take a fresh photo</h2><p className="atlas-muted text-sm font-bold">Use the live local camera, then review and save the shot.</p></div></div>
            <div className="atlas-simple-panel-body grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
              <div className="grid aspect-video place-items-center rounded-lg border border-dashed" style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}><CameraIcon className="size-10" style={{ color: "var(--atlas-accent)" }} /></div>
              <div className="grid gap-3">
                <Link className="atlas-btn atlas-btn-primary h-11! text-base" href={`/files/${fileId}/images/capture?returnTo=${encodeURIComponent(returnTo)}`}><CameraIcon />Open camera</Link>
                <p className="atlas-subtle text-sm">Best on the site iPad or phone. The saved shot also remains in File Images.</p>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "library" ? (
          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-head"><div><h2>Use a file image</h2><p className="atlas-muted text-sm font-bold">Ready site photos and completed generated outputs.</p></div></div>
            <div className="atlas-simple-panel-body grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assets.length ? assets.map((asset) => (
                <button
                  aria-pressed={selected === asset.id}
                  className="relative overflow-hidden rounded-lg border text-left"
                  key={asset.id}
                  onClick={() => setSelected(asset.id)}
                  style={{ borderColor: selected === asset.id ? "var(--atlas-accent)" : "var(--atlas-border)", boxShadow: selected === asset.id ? "0 0 0 2px var(--atlas-accent)" : "none", background: "var(--atlas-bg-muted)" }}
                  type="button"
                >
                  <div className="relative aspect-4/3"><Image alt={asset.label} className="object-cover" fill sizes="(max-width: 640px) 100vw, 33vw" src={asset.url} unoptimized /></div>
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold text-white">{asset.kind === "ai_generated" ? <SparklesIcon className="size-3" /> : <CameraIcon className="size-3" />}{asset.kind === "ai_generated" ? "Generated" : "Site photo"}</span>
                  {selected === asset.id ? <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full text-white" style={{ background: "var(--atlas-accent)" }}><CheckIcon className="size-4" /></span> : null}
                  <span className="block truncate px-3 py-2 text-sm font-bold">{asset.label}</span>
                </button>
              )) : <div className="col-span-full grid min-h-48 place-items-center rounded-lg border border-dashed text-center" style={{ borderColor: "var(--atlas-border-strong)", color: "var(--atlas-text-tertiary)" }}>No ready images yet. Take or upload the source now.</div>}
            </div>
          </section>
        ) : null}

        {tab === "upload" ? (
          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-head"><div><h2>Upload an image</h2><p className="atlas-muted text-sm font-bold">Add one source from this device.</p></div></div>
            <div className="atlas-simple-panel-body grid gap-3">
              <Link className="grid min-h-56 place-items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center" href={`/files/${fileId}/images/capture?mode=upload&returnTo=${encodeURIComponent(returnTo)}`} style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}>
                <span className="grid size-12 place-items-center rounded-full" style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}><UploadCloudIcon className="size-6" /></span>
                <strong>Choose an image</strong><span className="atlas-muted text-sm font-bold">JPEG, PNG, WebP, HEIC, or HEIF up to 12 MB.</span>
              </Link>
              <p className="rounded-lg p-3 text-sm" style={{ background: "var(--atlas-bg-muted)", color: "var(--atlas-text-secondary)" }}>Uploads go through Atlas to Bunny, then return here selected.</p>
            </div>
          </section>
        ) : null}
        {error ? <p className="atlas-login-error mt-4" role="alert">{error}</p> : null}
      </section>

      <AtlasBottomActions label="Atlas Image source actions">
        <Link className="atlas-bottom-nav-item" href={`/files/${fileId}/pipelines/atlas-image`}><ArrowLeftIcon className="size-4" />Back</Link>
        <button className="atlas-bottom-nav-item atlas-active" disabled={!selected || pending} onClick={() => void continueToWorkspace()} style={{ opacity: !selected || pending ? 0.5 : 1 }} type="button">{pending ? "Opening…" : "Continue to direction"}<ArrowRightIcon className="size-4" /></button>
      </AtlasBottomActions>
    </>
  );
}
