"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleDotIcon,
  CornerDownRightIcon,
  CpuIcon,
  ExternalLinkIcon,
  HardDriveIcon,
  HashIcon,
  ImageIcon,
  LayersIcon,
  MicIcon,
  PencilRulerIcon,
  QuoteIcon,
  RotateCcwIcon,
  SparklesIcon,
  SquareArrowOutUpRightIcon,
  TimerIcon,
} from "lucide-react";

import type { MockupScreen } from "../types";
import {
  mockAssets,
  mockGenerations,
  referenceCategories,
  referencesById,
  type MockGeneration,
} from "../mock-data";
import { MockBottomNav, MockImage, MockTopbar, StatusPill } from "../mock-ui";

/* ------------------------------------------------------------------ */
/* Anchors                                                             */
/* ------------------------------------------------------------------ */

const gen = mockGenerations.find((g) => g.id === "gen-terrazzo-2") as MockGeneration & {
  resultSeed: string;
  parentId: string;
};
const parent = mockGenerations.find((g) => g.id === gen.parentId) as MockGeneration & {
  resultSeed: string;
};
const outputAsset = mockAssets.find((asset) => asset.seed === gen.resultSeed);
const references = referencesById(gen.referenceIds);

const categoryLabels = new Map(
  referenceCategories.map((category) => [category.slug, category.label])
);

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function PanelHead({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="atlas-simple-panel-head">
      <div className="flex min-w-0 items-center gap-2">
        <span style={{ color: "var(--atlas-accent)" }}>{icon}</span>
        <h2>{title}</h2>
      </div>
      {hint ? (
        <span
          className="shrink-0 text-xs font-bold"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function ChainThumb({ seed, tag }: { seed: string; tag: string }) {
  return (
    <div className="w-16 shrink-0">
      <MockImage
        seed={seed}
        ratio="4 / 3"
        className="rounded-md"
        style={{ border: "1px solid var(--atlas-border)" }}
      />
      <span
        className="mt-1 block text-center text-[9px] font-bold uppercase tracking-normal"
        style={{ color: "var(--atlas-text-tertiary)" }}
      >
        {tag}
      </span>
    </div>
  );
}

function SystemRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span
        className="inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-normal"
        style={{ color: "var(--atlas-text-tertiary)" }}
      >
        {icon}
        {label}
      </span>
      <span
        className="min-w-0 break-all text-right text-sm font-bold"
        style={{
          color: "var(--atlas-text-primary)",
          fontFamily: mono ? "var(--font-mono, monospace)" : undefined,
          fontSize: mono ? "12px" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function GenerationDetailScreen() {
  // Two-page flow: the overview shows only before → after. "Open details"
  // navigates to a separate details page (direction/references/lineage/
  // system) that has its own back button — not an inline dropdown.
  const [showDetails, setShowDetails] = useState(false);

  const baseCrumb = ["Hartley — Main Bathroom", "Atlas Image", "Terrazzo floor, warmer light"];

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ background: "var(--atlas-bg-root)", color: "var(--atlas-text-primary)" }}
    >
      <MockTopbar
        breadcrumb={showDetails ? [...baseCrumb, "Details"] : baseCrumb}
        onBack={showDetails ? () => setShowDetails(false) : undefined}
      />

      <section
        className={`atlas-detail-view flex flex-1 flex-col${
          showDetails ? "" : " justify-center"
        }`}
      >
        {/* Page 1 — overview: before → after only ------------------- */}
        {showDetails ? null : (
        <div className="atlas-simple-panel" style={{ boxShadow: "var(--atlas-shadow)" }}>
          <div className="atlas-simple-panel-body">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="atlas-eyebrow flex items-center gap-1.5">
                  <SparklesIcon className="size-3.5" style={{ color: "var(--atlas-accent)" }} />
                  Atlas Image · Generation
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-normal">{gen.title}</h1>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
                  {gen.createdAt}
                </p>
              </div>
              <StatusPill tone="green" className="mt-1 shrink-0">
                <CircleDotIcon className="size-3.5" />
                Saved
              </StatusPill>
            </div>

            {/* before -> after */}
            <div className="mt-5 grid items-center gap-4" style={{ gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)" }}>
              <figure className="min-w-0">
                <MockImage
                  seed={gen.sourceSeed}
                  ratio="4 / 3"
                  className="rounded-lg"
                  style={{ border: "1px solid var(--atlas-border)" }}
                />
                <figcaption className="mt-2 flex items-center gap-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-normal"
                    style={{ color: "var(--atlas-text-tertiary)" }}
                  >
                    Before
                  </span>
                  <span className="truncate text-sm font-bold" style={{ color: "var(--atlas-text-secondary)" }}>
                    {gen.sourceLabel}
                  </span>
                </figcaption>
              </figure>

              <div
                className="grid size-10 shrink-0 place-items-center rounded-full"
                style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}
              >
                <ArrowRightIcon className="size-5" />
              </div>

              <figure className="min-w-0">
                <MockImage
                  seed={gen.resultSeed}
                  ratio="4 / 3"
                  className="rounded-lg"
                  style={{ border: "1px solid var(--atlas-accent-muted)" }}
                />
                <figcaption className="mt-2 flex items-center gap-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-normal"
                    style={{ color: "var(--atlas-accent)" }}
                  >
                    After
                  </span>
                  <span className="truncate text-sm font-bold" style={{ color: "var(--atlas-text-secondary)" }}>
                    {outputAsset?.label ?? "Generated result"}
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
        )}

        {/* Page 2 — details, reached via "Open details" ------------- */}
        {showDetails ? (
          <>
            {/* Back to overview + identity header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <button className="atlas-btn atlas-btn-outline h-9 px-3" type="button">
                  <ExternalLinkIcon className="size-4" />
                  Open source photo
                </button>
                <div className="atlas-eyebrow mt-3 flex items-center gap-1.5">
                  <LayersIcon className="size-3.5" style={{ color: "var(--atlas-accent)" }} />
                  Atlas Image · Details
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-normal">{gen.title}</h1>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
                  {gen.createdAt}
                </p>
              </div>
              <StatusPill tone="green" className="mt-1 shrink-0">
                <CircleDotIcon className="size-3.5" />
                Saved
              </StatusPill>
            </div>

            {/* Details grid ----------------------------------------- */}
            <div className="mt-5 grid gap-4" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {/* Left column */}
          <div className="grid content-start gap-4">
            {/* Direction */}
            <div className="atlas-simple-panel">
              <PanelHead icon={<PencilRulerIcon className="size-4" />} title="Direction" />
              <div className="atlas-simple-panel-body">
                <blockquote
                  className="relative rounded-lg p-4 pl-5 text-sm leading-relaxed"
                  style={{
                    background: "var(--atlas-bg-muted)",
                    color: "var(--atlas-text-primary)",
                    borderLeft: "3px solid var(--atlas-accent)",
                  }}
                >
                  <QuoteIcon
                    className="absolute right-3 top-3 size-4"
                    style={{ color: "var(--atlas-text-tertiary)", opacity: 0.5 }}
                  />
                  “{gen.prompt}”
                </blockquote>
                <div
                  className="mt-3 flex items-center gap-2 text-xs font-bold"
                  style={{ color: "var(--atlas-text-tertiary)" }}
                >
                  <MicIcon className="size-3.5 shrink-0" style={{ color: "var(--atlas-accent)" }} />
                  Sent as edited voice transcript
                </div>
              </div>
            </div>

            {/* References used */}
            <div className="atlas-simple-panel">
              <PanelHead
                icon={<LayersIcon className="size-4" />}
                title="References used"
                hint={`${references.length} item${references.length === 1 ? "" : "s"}`}
              />
              <div className="atlas-simple-panel-body grid gap-2.5">
                {references.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center gap-3 rounded-lg p-2"
                    style={{ background: "var(--atlas-bg-muted)" }}
                  >
                    <div className="w-14 shrink-0">
                      <MockImage
                        seed={ref.seed}
                        ratio="1 / 1"
                        className="rounded-md"
                        icon={<ImageIcon className="size-4" />}
                        style={{ border: "1px solid var(--atlas-border)" }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold" style={{ color: "var(--atlas-text-primary)" }}>
                        {ref.label}
                      </div>
                      <div className="mt-0.5 truncate text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
                        {ref.tags.join(" · ")}
                      </div>
                    </div>
                    <StatusPill tone="muted" className="shrink-0">
                      {categoryLabels.get(ref.category) ?? ref.category}
                    </StatusPill>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="grid content-start gap-4">
            {/* Lineage */}
            <div className="atlas-simple-panel">
              <PanelHead icon={<LayersIcon className="size-4" />} title="Lineage" />
              <div className="atlas-simple-panel-body">
                {/* Parent */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                      style={{
                        border: "1px solid var(--atlas-border-strong)",
                        background: "var(--atlas-bg-surface)",
                        color: "var(--atlas-text-tertiary)",
                      }}
                    >
                      1
                    </span>
                    <span
                      className="mt-1 w-px flex-1"
                      style={{ borderLeft: "2px solid var(--atlas-border-strong)", minHeight: 22 }}
                    />
                  </div>
                  <div
                    className="mb-3 flex flex-1 items-center gap-3 rounded-lg border p-3"
                    style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-surface)" }}
                  >
                    <ChainThumb seed={parent.sourceSeed} tag="Before" />
                    <ArrowRightIcon className="size-3.5 shrink-0" style={{ color: "var(--atlas-text-tertiary)" }} />
                    <ChainThumb seed={parent.resultSeed} tag="After" />
                    <div className="ml-1 min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{parent.title}</div>
                      <div className="mt-0.5 text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
                        Parent generation
                      </div>
                    </div>
                    <button className="atlas-btn atlas-btn-outline shrink-0" type="button">
                      <SquareArrowOutUpRightIcon />
                      Open
                    </button>
                  </div>
                </div>

                {/* This generation */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                      style={{ background: "var(--atlas-accent)", color: "#ffffff" }}
                    >
                      2
                    </span>
                    <span
                      className="mt-1 w-px flex-1"
                      style={{ borderLeft: "2px dashed var(--atlas-border-strong)", minHeight: 22 }}
                    />
                  </div>
                  <div
                    className="mb-3 flex flex-1 items-center gap-3 rounded-lg border p-3"
                    style={{
                      borderColor: "var(--atlas-accent)",
                      background: "var(--atlas-accent-soft)",
                    }}
                  >
                    <ChainThumb seed={gen.sourceSeed} tag="Before" />
                    <ArrowRightIcon className="size-3.5 shrink-0" style={{ color: "var(--atlas-accent)" }} />
                    <ChainThumb seed={gen.resultSeed} tag="After" />
                    <div className="ml-1 min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{gen.title}</div>
                      <div className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold" style={{ color: "var(--atlas-accent)" }}>
                        <CircleDotIcon className="size-3" />
                        You are here
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next (empty) */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full border border-dashed text-[10px] font-bold"
                      style={{ borderColor: "var(--atlas-border-strong)", color: "var(--atlas-text-tertiary)" }}
                    >
                      3
                    </span>
                  </div>
                  <div
                    className="flex flex-1 items-center gap-3 rounded-lg border border-dashed p-3"
                    style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-md"
                      style={{ background: "var(--atlas-bg-hover)", color: "var(--atlas-text-tertiary)" }}
                    >
                      <PencilRulerIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold" style={{ color: "var(--atlas-text-secondary)" }}>
                        Continue editing starts here
                      </div>
                      <div className="mt-0.5 text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
                        This result becomes the next before image
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System */}
            <div className="atlas-simple-panel">
              <PanelHead icon={<CpuIcon className="size-4" />} title="System" />
              <div
                className="atlas-simple-panel-body divide-y"
                style={{ borderColor: "var(--atlas-border)" }}
              >
                <SystemRow
                  icon={<SparklesIcon className="size-3.5" />}
                  label="Model"
                  value="openai · responses image tool"
                />
                <SystemRow
                  icon={<HardDriveIcon className="size-3.5" />}
                  label="Output key"
                  value={outputAsset?.bunnyKey ?? "—"}
                  mono
                />
                <SystemRow
                  icon={<HashIcon className="size-3.5" />}
                  label="Generation ID"
                  value={gen.id}
                  mono
                />
                <SystemRow
                  icon={<TimerIcon className="size-3.5" />}
                  label="Duration"
                  value="34s"
                />
              </div>
            </div>
          </div>
            </div>
          </>
        ) : null}
      </section>

      {/* Bottom nav — two big half-and-half actions, swapped per stage.
          Stage 1: reveal details / continue editing. Stage 2: the source
          photo + regenerate actions that used to crowd the in-page bar. */}
      {showDetails ? (
        <MockBottomNav>
          <button
            className="atlas-btn atlas-btn-outline w-full"
            onClick={() => setShowDetails(false)}
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
            <RotateCcwIcon />
            Regenerate
          </button>
        </MockBottomNav>
      ) : (
        <MockBottomNav>
          <button
            className="atlas-btn atlas-btn-outline w-full"
            onClick={() => setShowDetails(true)}
            style={{ height: 48, fontSize: 14 }}
            type="button"
          >
            <LayersIcon />
            Open details
          </button>
          <button
            className="atlas-btn atlas-btn-primary w-full"
            style={{ height: 48, fontSize: 14 }}
            type="button"
          >
            <CornerDownRightIcon />
            Continue editing
          </button>
        </MockBottomNav>
      )}
    </div>
  );
}

export const screen: MockupScreen = {
  id: "generation-detail",
  title: "Previous generation detail",
  description:
    "Opening a past generation from history. Stage one shows just before → after with Open details / Continue editing; Open details reveals the prompt, references, lineage, and system metadata, swapping the nav to Open source photo / Regenerate.",
  viewport: "desktop",
  Component: GenerationDetailScreen,
};
