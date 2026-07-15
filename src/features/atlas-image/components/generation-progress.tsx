import Image from "next/image";
import { CheckIcon, CircleDotIcon, HardDriveIcon, ImageIcon, SparklesIcon } from "lucide-react";

import type { DirectionSnapshot } from "@/features/atlas-image/data";
import { ExpandableImage } from "@/features/files/components/expandable-image";

type ProgressAsset = { id: string; label: string; url: string };
type ProgressReference = { id: string; label: string; url: string };

export function AtlasImageGenerationProgress({
  source,
  directions,
  references,
  quality,
}: {
  source: ProgressAsset;
  directions: DirectionSnapshot[];
  references: ProgressReference[];
  quality: string;
}) {
  return (
    <section aria-busy="true" aria-live="polite" className="atlas-simple-panel" role="status" style={{ boxShadow: "var(--atlas-shadow)" }}>
      <div className="atlas-simple-panel-body">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="atlas-eyebrow flex items-center gap-1.5"><SparklesIcon className="size-3.5" style={{ color: "var(--atlas-accent)" }} />Atlas Image · Generating</div>
            <h1 className="mt-1 text-2xl font-bold">Generating one concept…</h1>
            <p className="mt-1 text-sm font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>Usually 20–40 seconds · saved automatically when done</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold capitalize" style={{ borderColor: "var(--atlas-accent-muted)", background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}><CircleDotIcon className="size-3.5 animate-pulse" />{quality}</span>
        </div>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="grid gap-4">
            <figure className="min-w-0">
              <ExpandableImage alt={source.label} className="aspect-4/3 w-full rounded-lg border" imageClassName="object-contain" sizes="(max-width: 1024px) 100vw, 48vw" src={source.url} />
              <figcaption className="mt-2 flex items-center gap-2"><span className="text-[11px] font-bold uppercase" style={{ color: "var(--atlas-text-tertiary)" }}>Before</span><span className="truncate text-sm font-bold" style={{ color: "var(--atlas-text-secondary)" }}>{source.label}</span></figcaption>
            </figure>

            <div className="rounded-lg border-l-3 p-3" style={{ borderColor: "var(--atlas-accent-muted)", background: "var(--atlas-bg-muted)" }}>
              <span className="atlas-label">Direction</span>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--atlas-text-secondary)" }}>{directions.map((direction) => direction.body).join(" · ")}</p>
            </div>

            {references.length ? <div><span className="atlas-label">{references.length} {references.length === 1 ? "reference" : "references"}</span><div className="mt-2 flex flex-wrap gap-2">{references.map((reference, index) => <div className="flex items-center gap-2" key={reference.id}><span className="grid size-5 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--atlas-accent)" }}>{index + 1}</span><div className="relative aspect-square w-11 overflow-hidden rounded-md"><Image alt={reference.label} className="object-cover" fill sizes="44px" src={reference.url} unoptimized /></div></div>)}</div></div> : null}
          </div>

          <div className="grid gap-4">
            <div className="relative aspect-4/3 w-full animate-pulse overflow-hidden rounded-lg border border-dashed" style={{ borderColor: "var(--atlas-border-strong)", background: "linear-gradient(135deg, var(--atlas-bg-muted), var(--atlas-bg-hover))" }}>
              <span className="absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[11px] font-bold" style={{ background: "color-mix(in srgb, var(--atlas-bg-surface) 80%, transparent)", color: "var(--atlas-text-tertiary)" }}>After</span>
            </div>

            <div className="relative h-1.5 overflow-hidden rounded-full" style={{ background: "var(--atlas-bg-muted)" }}><span className="atlas-generation-progress-bar absolute inset-y-0 w-1/3 rounded-full" style={{ background: "var(--atlas-accent)" }} /></div>

            <div className="grid gap-2" aria-label="Generation stages">
              {[
                { icon: <CheckIcon />, label: "Prepare source and directions" },
                { icon: <ImageIcon />, label: "Generate one concept" },
                { icon: <HardDriveIcon />, label: "Save to File Images" },
              ].map((stage, index) => <div className="flex items-center gap-3 rounded-lg border p-3" key={stage.label} style={{ borderColor: index === 1 ? "var(--atlas-accent-muted)" : "var(--atlas-border)", background: index === 1 ? "var(--atlas-accent-soft)" : "var(--atlas-bg-muted)" }}><span className="grid size-8 shrink-0 place-items-center rounded-full [&>svg]:size-4" style={{ background: index === 1 ? "var(--atlas-accent)" : "var(--atlas-bg-surface)", color: index === 1 ? "white" : "var(--atlas-text-tertiary)" }}>{stage.icon}</span><span className="text-sm font-bold">{stage.label}</span>{index === 1 ? <span className="ml-auto size-2 animate-pulse rounded-full" style={{ background: "var(--atlas-accent)" }} /> : null}</div>)}
            </div>
            <p className="text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>Keep this page open, or return to history while Atlas finishes.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
