import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleDotIcon,
  ExternalLinkIcon,
  HardDriveIcon,
  HashIcon,
  ImageIcon,
  LayersIcon,
  PencilRulerIcon,
  SparklesIcon,
} from "lucide-react";

import type { AtlasImageGenerationDto } from "@/features/atlas-image/data";
import {
  ContinueGenerationButton,
  GenerationAutoRefresh,
  RetryGenerationButton,
} from "@/features/atlas-image/components/generation-actions";
import { AtlasImageGenerationProgress } from "@/features/atlas-image/components/generation-progress";
import { ExpandableImage } from "@/features/files/components/expandable-image";
import { AtlasBottomActions, AtlasPill } from "@/features/files/components/file-ui";

function AssetFrame({ url, label, accent }: { url: string; label: string; accent?: boolean }) {
  return (
    <figure className="min-w-0">
      {url ? (
        <ExpandableImage
          alt={label}
          className="aspect-4/3 rounded-lg border"
          imageClassName="object-contain"
          sizes="(max-width: 768px) 100vw, 48vw"
          src={url}
        />
      ) : (
        <div className="relative grid aspect-4/3 size-full place-items-center overflow-hidden rounded-lg border" style={{ borderColor: accent ? "var(--atlas-accent-muted)" : "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}>
          <SparklesIcon className="size-8 animate-pulse" />
        </div>
      )}
      <figcaption className="mt-2 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase" style={{ color: accent ? "var(--atlas-accent)" : "var(--atlas-text-tertiary)" }}>{accent ? "After" : "Before"}</span>
        <span className="truncate text-sm font-bold" style={{ color: "var(--atlas-text-secondary)" }}>{label}</span>
      </figcaption>
    </figure>
  );
}

function GenerationComparison({ generation }: { generation: AtlasImageGenerationDto }) {
  const complete = generation.status === "complete" && generation.output;
  return (
    <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <AssetFrame label={generation.source.label} url={generation.source.url} />
      <div className="grid size-10 place-items-center rounded-full" style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}><ArrowRightIcon className="size-5" /></div>
      <AssetFrame accent label={complete ? generation.output!.label : generation.errorMessage ?? "Waiting for a saved output"} url={complete ? generation.output!.url : ""} />
    </div>
  );
}

export function AtlasImageGenerationOverview({ fileId, generation }: { fileId: string; generation: AtlasImageGenerationDto }) {
  const complete = generation.status === "complete" && generation.output;

  if (generation.status === "generating") {
    return (
      <>
        <GenerationAutoRefresh active />
        <section className="atlas-detail-view flex flex-1 flex-col justify-center">
          <AtlasImageGenerationProgress directions={generation.directions} quality={generation.quality} references={generation.references} source={generation.source} />
        </section>
        <AtlasBottomActions label="Generation progress actions">
          <Link className="atlas-bottom-nav-item" href={`/files/${fileId}/pipelines/atlas-image`}><ArrowLeftIcon className="size-4" />View history</Link>
          <button aria-busy="true" className="atlas-bottom-nav-item atlas-active" disabled type="button"><SparklesIcon className="size-4 animate-pulse" />Generating one concept…</button>
        </AtlasBottomActions>
      </>
    );
  }

  return (
    <>
      <section className="atlas-detail-view flex flex-1 flex-col justify-center">
        <div className="atlas-simple-panel" style={{ boxShadow: "var(--atlas-shadow)" }}>
          <div className="atlas-simple-panel-body">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="atlas-eyebrow flex items-center gap-1.5"><SparklesIcon className="size-3.5" style={{ color: "var(--atlas-accent)" }} />Atlas Image · Generation</div>
                <h1 className="mt-1 text-2xl font-bold">{complete ? generation.output!.label : `Generation ${generation.status}`}</h1>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>{new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium", timeStyle: "short" }).format(generation.createdAt)}</p>
              </div>
              <AtlasPill tone={complete ? "green" : generation.status === "failed" ? "muted" : "amber"}><CircleDotIcon className="size-3.5" />{complete ? "Saved" : generation.status}</AtlasPill>
            </div>
            <div className="mt-5"><GenerationComparison generation={generation} /></div>
            {!complete ? <div className="mt-5 rounded-lg p-4 text-sm" style={{ background: "var(--atlas-bg-muted)", color: "var(--atlas-text-secondary)" }}><strong className="block capitalize" style={{ color: "var(--atlas-text-primary)" }}>{generation.status}</strong>{generation.errorMessage ?? "Atlas could not finish this attempt."}</div> : null}
          </div>
        </div>
      </section>
      <AtlasBottomActions label="Generation result actions">
        <Link className="atlas-bottom-nav-item" href={complete ? `/files/${fileId}/pipelines/atlas-image/generations/${generation.id}/details` : `/files/${fileId}/pipelines/atlas-image`}><LayersIcon className="size-4" />{complete ? "Open details" : "Back to history"}</Link>
        {complete ? <ContinueGenerationButton fileId={fileId} generationId={generation.id} /> : <RetryGenerationButton fileId={fileId} generationId={generation.id} />}
      </AtlasBottomActions>
    </>
  );
}

export function AtlasImageGenerationDetails({ fileId, generation, lineage }: { fileId: string; generation: AtlasImageGenerationDto; lineage: AtlasImageGenerationDto[] }) {
  return (
    <>
      <section className="atlas-detail-view flex flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link className="atlas-btn atlas-btn-outline h-9! px-3" href={`/files/${fileId}/images/${generation.source.id}`}><ExternalLinkIcon />Open source photo</Link>
            <div className="atlas-eyebrow mt-3 flex items-center gap-1.5"><LayersIcon className="size-3.5" style={{ color: "var(--atlas-accent)" }} />Atlas Image · Details</div>
            <h1 className="mt-1 text-2xl font-bold">{generation.output?.label ?? "Generation details"}</h1>
          </div>
          <AtlasPill tone={generation.status === "complete" ? "green" : "amber"}>{generation.status}</AtlasPill>
        </div>

        <section className="atlas-simple-panel mt-5">
          <div className="atlas-simple-panel-head"><h2 className="flex items-center gap-2"><ImageIcon className="size-4" style={{ color: "var(--atlas-accent)" }} />Before and after</h2><span className="text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>Use Full view or double-tap either image</span></div>
          <div className="atlas-simple-panel-body"><GenerationComparison generation={generation} /></div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="grid content-start gap-4">
            <section className="atlas-simple-panel">
              <div className="atlas-simple-panel-head"><h2 className="flex items-center gap-2"><PencilRulerIcon className="size-4" style={{ color: "var(--atlas-accent)" }} />Direction</h2><span className="atlas-muted text-xs font-bold">{generation.directions.length} entries</span></div>
              <div className="atlas-simple-panel-body grid gap-2">
                {generation.directions.map((direction, index) => <blockquote className="rounded-lg border-l-3 p-3 text-sm" key={direction.id} style={{ borderColor: "var(--atlas-accent)", background: "var(--atlas-bg-muted)" }}><span className="mb-1 block text-[10px] font-bold uppercase" style={{ color: "var(--atlas-accent)" }}>Direction {index + 1}</span>{direction.body}</blockquote>)}
                <details className="mt-2 rounded-lg border p-3" style={{ borderColor: "var(--atlas-border)" }}><summary className="cursor-pointer text-sm font-bold">Compiled provider prompt</summary><pre className="mt-3 whitespace-pre-wrap text-xs" style={{ color: "var(--atlas-text-secondary)" }}>{generation.compiledPrompt}</pre></details>
              </div>
            </section>

            <section className="atlas-simple-panel">
              <div className="atlas-simple-panel-head"><h2 className="flex items-center gap-2"><ImageIcon className="size-4" style={{ color: "var(--atlas-accent)" }} />References used</h2><span className="atlas-muted text-xs font-bold">{generation.references.length}</span></div>
              <div className="atlas-simple-panel-body grid gap-2">
                {generation.references.length ? generation.references.map((reference, index) => <div className="flex items-center gap-3 rounded-lg p-2" key={reference.id} style={{ background: "var(--atlas-bg-muted)" }}><span className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: "var(--atlas-accent)" }}>{index + 1}</span><div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-md"><Image alt={reference.label} className="object-cover" fill sizes="56px" src={reference.url} unoptimized /></div><div className="min-w-0"><p className="truncate text-sm font-bold">{reference.label}</p><p className="truncate text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>{reference.categoryLabel} · {reference.tags.join(" · ")}</p></div></div>) : <p className="atlas-subtle text-sm">No references were used.</p>}
              </div>
            </section>
          </div>

          <div className="grid content-start gap-4">
            <section className="atlas-simple-panel">
              <div className="atlas-simple-panel-head"><h2 className="flex items-center gap-2"><LayersIcon className="size-4" style={{ color: "var(--atlas-accent)" }} />Lineage</h2></div>
              <div className="atlas-simple-panel-body grid gap-2">{lineage.map((entry, index) => <Link className="flex items-center gap-3 rounded-lg border p-3" href={`/files/${fileId}/pipelines/atlas-image/generations/${entry.id}`} key={entry.id} style={{ borderColor: entry.id === generation.id ? "var(--atlas-accent)" : "var(--atlas-border)", background: entry.id === generation.id ? "var(--atlas-accent-soft)" : "var(--atlas-bg-surface)" }}><span className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: entry.id === generation.id ? "var(--atlas-accent)" : "var(--atlas-bg-muted)", color: entry.id === generation.id ? "white" : "var(--atlas-text-secondary)" }}>{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{entry.output?.label ?? `Attempt ${entry.status}`}</p><p className="text-xs capitalize" style={{ color: "var(--atlas-text-tertiary)" }}>{entry.quality} · {entry.status}</p></div><ArrowRightIcon className="size-4" /></Link>)}</div>
            </section>

            <section className="atlas-simple-panel">
              <div className="atlas-simple-panel-head"><h2>System</h2></div>
              <div className="atlas-simple-panel-body divide-y" style={{ borderColor: "var(--atlas-border)" }}><SystemRow icon={<SparklesIcon />} label="Model / quality" value={`${generation.model} · ${generation.quality}`} /><SystemRow icon={<HashIcon />} label="Generation ID" value={generation.id} /><SystemRow icon={<HashIcon />} label="Provider request" value={generation.providerRequestId ?? "Not returned"} /><SystemRow icon={<HardDriveIcon />} label="Output key" value={generation.output?.storageKey ?? "No saved output"} /></div>
            </section>
          </div>
        </div>
      </section>
      <AtlasBottomActions label="Generation detail actions"><Link className="atlas-bottom-nav-item" href={`/files/${fileId}/pipelines/atlas-image/generations/${generation.id}`}><ArrowLeftIcon className="size-4" />Back</Link><RetryGenerationButton fileId={fileId} generationId={generation.id} label="Regenerate" /></AtlasBottomActions>
    </>
  );
}

function SystemRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 py-2.5"><span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase" style={{ color: "var(--atlas-text-tertiary)" }}><span className="[&>svg]:size-3.5">{icon}</span>{label}</span><span className="min-w-0 break-all text-right text-xs font-bold">{value}</span></div>;
}
