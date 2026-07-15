"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  CornerDownRightIcon,
  FileTextIcon,
  ImageIcon,
  ImageOffIcon,
  ImagesIcon,
  LayersIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  SquareArrowOutUpRightIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { pipelineDefinitions } from "@/features/pipelines/registry";
import { workflowStageLabels } from "@/types/atlas";
import { cn } from "@/lib/utils";
import type { MockupScreen } from "../types";
import {
  activeFile,
  generationStatusLabels,
  mockGenerations,
  type MockGeneration,
  type MockGenerationStatus,
} from "../mock-data";
import {
  MockBottomNav,
  MockImage,
  MockTopbar,
  StatusPill,
  type PillTone,
} from "../mock-ui";

/* ------------------------------------------------------------------ */
/* Stage vocabulary                                                    */
/* ------------------------------------------------------------------ */

/**
 * Frame 10 is a two-stage flow mirroring production:
 *  - "select"  — the file's pipeline picker (six options; only Atlas Image is live)
 *  - "atlas"   — the Atlas Image generation history for this file
 * Tapping the Atlas Image tile crosses into "atlas"; the Back action returns.
 */
type Stage = "select" | "atlas";

const pipelineIcons = {
  atlas_image: ImageIcon,
  proposal: FileTextIcon,
  scheduler: CalendarDaysIcon,
  estimate_builder: BarChart3Icon,
  image_library: ImagesIcon,
} as const;

/** Short display name — "Hartley — Main Bathroom" → "Hartley". */
const fileShortName = activeFile.title.split("—")[0]?.trim() ?? activeFile.title;

/* ------------------------------------------------------------------ */
/* Status presentation                                                 */
/* ------------------------------------------------------------------ */

const statusTone: Record<MockGenerationStatus, PillTone> = {
  complete: "green",
  generating: "blue",
  failed: "destructive",
  blocked: "amber",
  retryable: "amber",
};

/** A generation carries a saved output only when it completed. */
function hasResult(gen: MockGeneration): gen is MockGeneration & { resultSeed: string } {
  return gen.status === "complete" && Boolean(gen.resultSeed);
}

function refChipLabel(count: number): string {
  if (count === 0) return "No refs";
  return `${count} ref${count === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------------ */
/* Stage 1 — pipeline picker                                           */
/* ------------------------------------------------------------------ */

function PipelinePicker({ onOpenAtlas }: { onOpenAtlas: () => void }) {
  return (
    <section className="atlas-pipelines-view flex-1">
      <div className="atlas-pipelines-heading">
        <div className="atlas-heading">
          <div className="atlas-eyebrow">File pipelines</div>
          <h1>Choose an action for {fileShortName}</h1>
          <p className="atlas-subtle">
            Each button opens a pipeline inside this file. The page is
            intentionally full-width so pipeline actions have room to breathe on
            iPad.
          </p>
        </div>
        <StatusPill tone="accent">{workflowStageLabels[activeFile.stage]}</StatusPill>
      </div>

      <div className="atlas-pipeline-button-grid">
        {pipelineDefinitions.map((pipeline) => {
          const Icon = pipelineIcons[pipeline.key];
          const isAtlas = pipeline.key === "atlas_image";
          const content = (
            <>
              <span
                className={cn(
                  "atlas-pipeline-action-icon",
                  pipeline.iconTone === "blue" && "atlas-pipeline-action-icon-blue",
                  pipeline.iconTone === "green" && "atlas-pipeline-action-icon-green",
                  pipeline.iconTone === "amber" && "atlas-pipeline-action-icon-amber"
                )}
              >
                <Icon />
              </span>
              <span className="atlas-pipeline-action-copy">
                <strong>{pipeline.name}</strong>
                <span>{pipeline.summary}</span>
              </span>
              <StatusPill tone={pipeline.tone}>{pipeline.status}</StatusPill>
            </>
          );

          if (isAtlas) {
            return (
              <button
                className="atlas-pipeline-action atlas-pipeline-action-primary text-left"
                key={pipeline.key}
                onClick={onOpenAtlas}
                type="button"
              >
                {content}
              </button>
            );
          }

          return (
            <div className="atlas-pipeline-action" key={pipeline.key}>
              {content}
            </div>
          );
        })}

        <div className="atlas-pipeline-action atlas-pipeline-action-add">
          <span className="atlas-pipeline-action-icon">
            <PlusIcon />
          </span>
          <span className="atlas-pipeline-action-copy">
            <strong>Add custom pipeline</strong>
            <span>Create another action button for this file type later.</span>
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Thumbnail pair (before -> after / no-image slot)                    */
/* ------------------------------------------------------------------ */

function ThumbPair({ gen }: { gen: MockGeneration }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="w-24">
        <MockImage
          seed={gen.sourceSeed}
          ratio="4 / 3"
          className="rounded-md"
          style={{ border: "1px solid var(--atlas-border)" }}
        />
        <span
          className="mt-1 block text-center text-[10px] font-bold uppercase tracking-normal"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          Before
        </span>
      </div>

      <ArrowRightIcon
        className="size-4 shrink-0"
        style={{ color: "var(--atlas-text-tertiary)" }}
      />

      <div className="w-24">
        {hasResult(gen) ? (
          <MockImage
            seed={gen.resultSeed}
            ratio="4 / 3"
            className="rounded-md"
            style={{ border: "1px solid var(--atlas-border)" }}
          />
        ) : (
          <div
            className="grid place-items-center rounded-md border border-dashed"
            style={{
              aspectRatio: "4 / 3",
              borderColor: "var(--atlas-border-strong)",
              background: "var(--atlas-bg-muted)",
              color: "var(--atlas-text-tertiary)",
            }}
          >
            {gen.status === "generating" ? (
              <SparklesIcon className="size-5 animate-pulse" />
            ) : (
              <ImageOffIcon className="size-5" />
            )}
          </div>
        )}
        <span
          className="mt-1 block text-center text-[10px] font-bold uppercase tracking-normal"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          After
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* History row                                                         */
/* ------------------------------------------------------------------ */

function HistoryRow({
  gen,
  parentTitle,
}: {
  gen: MockGeneration;
  parentTitle?: string;
}) {
  const complete = gen.status === "complete";
  const showReason = gen.status === "blocked" || gen.status === "failed";

  return (
    <div
      className="flex items-start gap-4 border p-4"
      style={{
        borderColor: "var(--atlas-border)",
        borderRadius: "var(--atlas-radius)",
        background: "var(--atlas-bg-surface)",
      }}
    >
      <ThumbPair gen={gen} />

      <div className="min-w-0 flex-1">
        {parentTitle ? (
          <div
            className="mb-1 flex items-center gap-1 text-[11px] font-bold"
            style={{ color: "var(--atlas-text-tertiary)" }}
          >
            <CornerDownRightIcon className="size-3.5 shrink-0" />
            <span className="truncate">Continued from {parentTitle}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-bold tracking-normal">
            {gen.title}
          </h3>
          <StatusPill
            tone={statusTone[gen.status]}
            className={gen.status === "generating" ? "animate-pulse" : undefined}
          >
            {generationStatusLabels[gen.status]}
          </StatusPill>
        </div>

        <p
          className="mt-1 truncate text-sm"
          style={{ color: "var(--atlas-text-secondary)" }}
        >
          {gen.prompt}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-bold"
            style={{ color: "var(--atlas-text-tertiary)" }}
          >
            {gen.createdAt}
          </span>
          <span style={{ color: "var(--atlas-border-strong)" }}>·</span>
          <span
            className="inline-flex items-center gap-1 text-xs font-bold"
            style={{ color: "var(--atlas-text-secondary)" }}
          >
            <LayersIcon className="size-3.5" />
            {refChipLabel(gen.referenceIds.length)}
          </span>
        </div>

        {gen.note ? (
          <p
            className="mt-2 rounded-md px-2.5 py-1.5 text-xs font-bold"
            style={{ background: "var(--atlas-bg-muted)", color: "var(--atlas-text-secondary)" }}
          >
            {gen.note}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2">
        {complete ? (
          <button className="atlas-btn atlas-btn-outline" type="button">
            <SquareArrowOutUpRightIcon />
            Open
          </button>
        ) : null}
        {gen.status === "retryable" ? (
          <button className="atlas-btn atlas-btn-outline" type="button">
            <RotateCcwIcon />
            Retry
          </button>
        ) : null}
        {showReason ? (
          <button className="atlas-btn atlas-btn-outline" type="button">
            <TriangleAlertIcon />
            View reason
          </button>
        ) : null}
        {complete ? (
          <button className="atlas-btn atlas-btn-outline" type="button">
            <SparklesIcon />
            Regenerate
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stage 2 — Atlas Image generation history                            */
/* ------------------------------------------------------------------ */

function AtlasImageStage({ isEmpty }: { isEmpty: boolean }) {
  const parentTitles = useMemo(
    () => new Map(mockGenerations.map((gen) => [gen.id, gen.title])),
    []
  );

  return (
    <section className="atlas-pipelines-view flex-1">
      <div className="atlas-heading mb-5">
        <div className="atlas-eyebrow">Pipelines · Atlas Image</div>
        <h1 className="flex items-center gap-2">
          <SparklesIcon
            className="size-6 shrink-0"
            style={{ color: "var(--atlas-accent)" }}
          />
          Atlas Image
        </h1>
        <p className="atlas-subtle">
          Every generation for this file, newest first — inspect one, regenerate
          from it, or start fresh.
        </p>
      </div>

      {isEmpty ? (
        <div
          className="grid place-items-center gap-3 border border-dashed px-6 py-14 text-center"
          style={{
            borderColor: "color-mix(in srgb, var(--atlas-accent) 40%, var(--atlas-border))",
            borderRadius: "var(--atlas-radius)",
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--atlas-accent-soft) 70%, transparent), transparent 62%), var(--atlas-bg-surface)",
          }}
        >
          <span
            className="grid size-14 place-items-center rounded-full"
            style={{
              background: "var(--atlas-accent-soft)",
              color: "var(--atlas-accent)",
            }}
          >
            <SparklesIcon className="size-7" />
          </span>
          <h2 className="text-xl font-bold tracking-normal">No generations yet</h2>
          <p
            className="max-w-md text-sm leading-relaxed"
            style={{ color: "var(--atlas-text-secondary)" }}
          >
            Pick a before photo, describe the change you want, and add a few
            references. Every result is saved here the moment it finishes.
          </p>
          <button
            className="atlas-btn atlas-btn-primary mt-1 h-11 px-5 text-base"
            type="button"
          >
            <PlusIcon />
            New Generation
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {mockGenerations.map((gen) => (
            <HistoryRow
              gen={gen}
              key={gen.id}
              parentTitle={
                gen.parentId ? parentTitles.get(gen.parentId) : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function PipelinesScreen({ stateId }: { stateId: string }) {
  const isEmpty = stateId === "empty";
  const [stage, setStage] = useState<Stage>("select");

  const breadcrumb =
    stage === "select"
      ? ["Files", activeFile.title, "Pipelines"]
      : ["Files", activeFile.title, "Atlas Image"];

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <MockTopbar breadcrumb={breadcrumb} />

      {stage === "select" ? (
        <>
          <PipelinePicker onOpenAtlas={() => setStage("atlas")} />

          {/* Production file bottom nav — File Details / Pipelines tabs */}
          <MockBottomNav>
            <button
              className="atlas-bottom-nav-item w-full"
              onClick={() => {
                window.location.hash = "file-details";
              }}
              style={{ height: 48 }}
              type="button"
            >
              File Details
            </button>
            <button
              className="atlas-bottom-nav-item atlas-active w-full"
              style={{ height: 48 }}
              type="button"
            >
              Pipelines
            </button>
          </MockBottomNav>
        </>
      ) : (
        <>
          <AtlasImageStage isEmpty={isEmpty} />

          {/* Atlas Image bottom nav — Back to pipelines / start a generation */}
          <MockBottomNav>
            <button
              className="atlas-btn atlas-btn-outline w-full"
              onClick={() => setStage("select")}
              style={{ height: 48, fontSize: 14 }}
              type="button"
            >
              <ArrowLeftIcon className="size-4" />
              Back
            </button>
            <button
              className="atlas-btn atlas-btn-primary w-full"
              style={{ height: 48, fontSize: 14 }}
              type="button"
            >
              <PlusIcon aria-hidden="true" />
              New Generation
            </button>
          </MockBottomNav>
        </>
      )}
    </div>
  );
}

export const screen: MockupScreen = {
  id: "pipelines",
  title: "Pipelines & generation history",
  description:
    "The file's pipeline picker — six options, only Atlas Image is live. Tapping it crosses into the Atlas Image generation history, with its own Back / New Generation bottom nav.",
  viewport: "desktop",
  states: [
    { id: "history", label: "With history" },
    { id: "empty", label: "No generations" },
  ],
  Component: PipelinesScreen,
};
