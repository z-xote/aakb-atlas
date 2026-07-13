"use client";

import { useMemo } from "react";
import {
  ArrowRightIcon,
  CornerDownRightIcon,
  FileTextIcon,
  ImageOffIcon,
  LayersIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  SquareArrowOutUpRightIcon,
  TriangleAlertIcon,
} from "lucide-react";

import type { MockupScreen } from "../types";
import {
  generationStatusLabels,
  mockGenerations,
  type MockGeneration,
  type MockGenerationStatus,
} from "../mock-data";
import { MockImage, MockTopbar, StatusPill, type PillTone } from "../mock-ui";

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
/* Header + secondary lane                                             */
/* ------------------------------------------------------------------ */

function AtlasImageHeader() {
  return (
    <div className="atlas-pipelines-heading">
      <div className="atlas-heading">
        <div className="atlas-eyebrow">Pipelines</div>
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
      <button className="atlas-btn atlas-btn-primary h-11 px-5 text-base" type="button">
        <PlusIcon />
        New Generation
      </button>
    </div>
  );
}

function OtherPipelinesLane() {
  return (
    <div className="mt-6">
      <div className="atlas-eyebrow mb-2">Other pipelines</div>
      <div className="atlas-pipeline-action atlas-pipeline-action-add">
        <span className="atlas-pipeline-action-icon">
          <FileTextIcon />
        </span>
        <span className="atlas-pipeline-action-copy">
          <strong>Proposal — coming later</strong>
          <span>
            Turn accepted concepts into a client-ready document. Not part of this
            pass.
          </span>
        </span>
        <StatusPill tone="muted">Later</StatusPill>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function PipelinesScreen({ stateId }: { stateId: string }) {
  const isEmpty = stateId === "empty";

  const parentTitles = useMemo(() => {
    const byId = new Map(mockGenerations.map((gen) => [gen.id, gen.title]));
    return byId;
  }, []);

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <MockTopbar breadcrumb={["Files", "Hartley — Main Bathroom", "Pipelines"]} />

      <section className="atlas-pipelines-view">
        <AtlasImageHeader />

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

        <OtherPipelinesLane />
      </section>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "pipelines",
  title: "Pipelines & generation history",
  description:
    "Atlas Image for one file — a chronological history of every generation with explicit saved, blocked, failed, and retryable states.",
  viewport: "desktop",
  states: [
    { id: "history", label: "With history" },
    { id: "empty", label: "No generations" },
  ],
  Component: PipelinesScreen,
};
