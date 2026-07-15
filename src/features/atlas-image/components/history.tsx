import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, CornerDownRightIcon, ImageOffIcon, PlusIcon, RotateCcwIcon, SparklesIcon } from "lucide-react";

import type { AtlasImageGenerationDto } from "@/features/atlas-image/data";
import { AtlasBottomActions, AtlasPill } from "@/features/files/components/file-ui";
import type { BadgeTone } from "@/features/files/components/atlas-primitives";
import type { AtlasImageGenerationStatus } from "@/types/atlas";

const statusPresentation: Record<AtlasImageGenerationStatus, { label: string; tone: BadgeTone }> = {
  complete: { label: "Complete", tone: "green" },
  generating: { label: "Generating", tone: "blue" },
  retryable: { label: "Retryable", tone: "amber" },
  blocked: { label: "Blocked", tone: "amber" },
  failed: { label: "Failed", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

function GenerationThumb({ generation, after }: { generation: AtlasImageGenerationDto; after?: boolean }) {
  const asset = after ? generation.output : generation.source;
  return <div className="w-24"><div className="relative aspect-4/3 overflow-hidden rounded-md border" style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}>{asset?.url ? <Image alt={after ? "Generated concept" : generation.source.label} className="object-cover" fill sizes="96px" src={asset.url} unoptimized /> : <span className="grid size-full place-items-center">{generation.status === "generating" ? <SparklesIcon className="size-5 animate-pulse" /> : <ImageOffIcon className="size-5" />}</span>}</div><span className="mt-1 block text-center text-[10px] font-bold uppercase" style={{ color: "var(--atlas-text-tertiary)" }}>{after ? "After" : "Before"}</span></div>;
}

export function AtlasImageHistory({ fileId, history }: { fileId: string; history: AtlasImageGenerationDto[] }) {
  return <>
    <section className="atlas-pipelines-view flex-1">
      <div className="atlas-pipelines-heading"><div className="atlas-heading"><div className="atlas-eyebrow">Atlas Image · History</div><h1>Before-to-after concepts</h1><p className="atlas-subtle">Every attempt keeps its source, ordered direction, references, quality, result, and recovery state.</p></div><AtlasPill tone="accent">{history.length} run{history.length === 1 ? "" : "s"}</AtlasPill></div>
      {history.length ? <div className="grid gap-3">{history.map((generation) => {
        const status = statusPresentation[generation.status];
        return <article className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-start" key={generation.id} style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-surface)" }}>
          <div className="flex shrink-0 items-center gap-2"><GenerationThumb generation={generation} /><ArrowRightIcon className="size-4" style={{ color: "var(--atlas-text-tertiary)" }} /><GenerationThumb after generation={generation} /></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{generation.output?.label ?? `Atlas Image · ${generation.quality}`}</h2><AtlasPill tone={status.tone}>{status.label}</AtlasPill></div>{generation.parentGenerationId ? <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold" style={{ color: "var(--atlas-accent)" }}><CornerDownRightIcon className="size-3" />Continues a previous output</p> : null}<p className="mt-2 line-clamp-2 text-sm" style={{ color: "var(--atlas-text-secondary)" }}>{generation.directions.map((direction) => direction.body).join(" · ")}</p><div className="mt-3 flex flex-wrap gap-2 text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}><span>{generation.references.length} refs</span><span>·</span><span>{generation.model}</span><span>·</span><span className="capitalize">{generation.quality}</span><span>·</span><span>{new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium", timeStyle: "short" }).format(generation.createdAt)}</span></div>{generation.errorMessage ? <p className="mt-2 text-sm font-bold" style={{ color: generation.status === "failed" ? "var(--destructive)" : "var(--atlas-amber)" }}>{generation.errorMessage}</p> : null}</div>
          <Link className="atlas-btn atlas-btn-outline shrink-0" href={`/files/${fileId}/pipelines/atlas-image/generations/${generation.id}`}>{generation.status === "complete" ? "Open result" : generation.status === "generating" ? "View progress" : "Review & recover"}{generation.status === "complete" ? <ArrowRightIcon /> : <RotateCcwIcon />}</Link>
        </article>;
      })}</div> : <div className="grid min-h-80 place-items-center rounded-lg border border-dashed p-8 text-center" style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}><div><SparklesIcon className="mx-auto size-8" style={{ color: "var(--atlas-accent)" }} /><h2 className="mt-3 text-lg font-bold">No generations yet</h2><p className="atlas-subtle mt-1 text-sm">Choose a source and build the first renovation concept.</p></div></div>}
    </section>
    <AtlasBottomActions label="Atlas Image history actions"><Link className="atlas-bottom-nav-item" href={`/files/${fileId}/pipelines`}><ArrowLeftIcon className="size-4" />Back to pipelines</Link><Link className="atlas-bottom-nav-item atlas-active" href={`/files/${fileId}/pipelines/atlas-image/new`}><PlusIcon className="size-4" />New generation</Link></AtlasBottomActions>
  </>;
}
