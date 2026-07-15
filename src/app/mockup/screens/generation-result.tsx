"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  CornerDownRightIcon,
  ExternalLinkIcon,
  HistoryIcon,
  QuoteIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";

import type { MockupScreen, MockupScreenProps } from "../types";
import {
  mockGenerations,
  referencesById,
  type MockGeneration,
  type MockReference,
} from "../mock-data";
import { MockBottomNav, MockImage, MockTopbar, StatusPill } from "../mock-ui";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

function generation(id: string): MockGeneration {
  const found = mockGenerations.find((gen) => gen.id === id);
  if (!found) {
    throw new Error(`Missing mock generation: ${id}`);
  }
  return found;
}

const completeGen = generation("gen-sage-1");
const retryableGen = generation("gen-timeout");
const blockedGen = generation("gen-blocked-brand");

const imageRadius = "calc(var(--atlas-radius) * 1.5)";

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

function PromptBlock({ prompt }: { prompt: string }) {
  return (
    <figure
      className="flex gap-2.5 rounded-lg p-3"
      style={{
        background: "var(--atlas-bg-muted)",
        borderLeft: "3px solid var(--atlas-accent-muted)",
      }}
    >
      <QuoteIcon
        className="mt-0.5 size-4 shrink-0"
        style={{ color: "var(--atlas-text-tertiary)" }}
      />
      <blockquote
        className="text-sm leading-relaxed"
        style={{ color: "var(--atlas-text-secondary)" }}
      >
        {prompt}
      </blockquote>
    </figure>
  );
}

function ReferenceRow({
  references,
  compact = false,
}: {
  references: MockReference[];
  compact?: boolean;
}) {
  if (references.length === 0) {
    return null;
  }
  const size = compact ? 44 : 56;
  return (
    <div className="flex flex-col gap-2">
      <span className="atlas-label">
        {references.length} {references.length === 1 ? "reference" : "references"}
      </span>
      <div className="flex flex-wrap gap-2.5">
        {references.map((reference) => (
          <div className="flex items-center gap-2" key={reference.id}>
            <MockImage
              seed={reference.seed}
              ratio="1 / 1"
              className="shrink-0"
              style={{ width: size, borderRadius: "var(--atlas-radius)" }}
            />
            {!compact ? (
              <span
                className="text-xs font-bold"
                style={{ color: "var(--atlas-text-secondary)" }}
              >
                {reference.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function BeforeImage({ seed }: { seed: string }) {
  return (
    <MockImage
      seed={seed}
      label="Before"
      ratio="4 / 3"
      className="w-full"
      style={{ borderRadius: imageRadius }}
    />
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section
      className="flex flex-col gap-5 border p-5"
      style={{
        borderColor: "var(--atlas-border)",
        borderRadius: "var(--atlas-radius)",
        background: "var(--atlas-bg-surface)",
      }}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* State: generating                                                   */
/* ------------------------------------------------------------------ */

function GeneratingState() {
  const references = referencesById(completeGen.referenceIds);

  return (
    <SectionCard>
      <style>{`
        @keyframes atlasGenSlide {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(320%); }
        }
      `}</style>

      <div
        className="grid items-start gap-5"
        style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr)" }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <BeforeImage seed={completeGen.sourceSeed} />
            <p className="atlas-muted text-xs font-bold">
              {completeGen.sourceLabel}
            </p>
          </div>

          {/* Direction + references tucked under the before image to
              reclaim the empty column and keep the card short. */}
          <PromptBlock prompt={completeGen.prompt} />
          <ReferenceRow references={references} compact />
        </div>

        <div className="flex flex-col gap-4">
          {/* Shimmering placeholder frame */}
          <div
            className="relative w-full animate-pulse overflow-hidden"
            style={{
              aspectRatio: "4 / 3",
              borderRadius: imageRadius,
              background:
                "linear-gradient(135deg, var(--atlas-bg-muted), var(--atlas-bg-hover))",
              border: "1px dashed var(--atlas-border-strong)",
            }}
          >
            <span
              className="absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[11px] font-bold"
              style={{
                background: "color-mix(in srgb, var(--atlas-bg-surface) 80%, transparent)",
                color: "var(--atlas-text-tertiary)",
              }}
            >
              After
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold"
                style={{ color: "var(--atlas-text-primary)" }}
              >
                Generating one concept…
              </span>
            </div>
            {/* Indeterminate progress bar */}
            <div
              className="relative h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--atlas-bg-muted)" }}
            >
              <span
                className="absolute inset-y-0 w-1/3 rounded-full"
                style={{
                  background: "var(--atlas-accent)",
                  animation: "atlasGenSlide 1.5s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          <p className="atlas-muted text-xs font-bold">
            Usually 20–40 seconds · saved automatically when done
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* State: complete                                                     */
/* ------------------------------------------------------------------ */

function CompleteState() {
  const references = referencesById(completeGen.referenceIds);

  return (
    <SectionCard>
      {/* Before -> after showcase */}
      <div
        className="grid items-center gap-4"
        style={{ gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)" }}
      >
        <div className="flex flex-col gap-2">
          <BeforeImage seed={completeGen.sourceSeed} />
          <p className="atlas-muted text-xs font-bold">{completeGen.sourceLabel}</p>
        </div>

        <span
          className="grid size-9 shrink-0 place-items-center rounded-full"
          style={{
            background: "var(--atlas-accent-soft)",
            color: "var(--atlas-accent)",
          }}
        >
          <ArrowRightIcon className="size-4" />
        </span>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <MockImage
              seed={completeGen.resultSeed ?? completeGen.sourceSeed}
              label="After"
              ratio="4 / 3"
              className="w-full"
              style={{
                borderRadius: imageRadius,
                boxShadow: "0 0 0 2px var(--atlas-accent)",
              }}
            />
            <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
              <StatusPill tone="green">
                <CheckIcon className="size-3.5" />
                Saved
              </StatusPill>
              <span
                className="rounded px-1.5 py-0.5 text-[11px] font-bold"
                style={{ background: "rgba(12, 10, 9, 0.62)", color: "#fafaf9" }}
              >
                {completeGen.createdAt}
              </span>
            </div>
          </div>
          <p
            className="text-xs font-bold"
            style={{ color: "var(--atlas-accent)" }}
          >
            New concept
          </p>
        </div>
      </div>

      <PromptBlock prompt={completeGen.prompt} />
      <ReferenceRow references={references} />

      {/* Secondary context — Continue editing / Finish live in the bottom nav */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"
        style={{ borderColor: "var(--atlas-border)" }}
      >
        <p className="atlas-muted text-xs font-bold">
          Saved to File images · Continue editing makes this the next before image.
        </p>
        <button
          className="atlas-btn h-9! px-3"
          style={{ color: "var(--atlas-text-secondary)" }}
          type="button"
        >
          <ExternalLinkIcon />
          Open in file
        </button>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Shared "outcome slot" for retryable / blocked                       */
/* ------------------------------------------------------------------ */

function OutcomeState({
  gen,
  tone,
  icon,
  pillLabel,
  pillTone,
}: {
  gen: MockGeneration;
  tone: string;
  icon: ReactNode;
  pillLabel: string;
  pillTone: "amber" | "destructive";
}) {
  const references = referencesById(gen.referenceIds);

  return (
    <SectionCard>
      <div
        className="grid items-stretch gap-4"
        style={{ gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)" }}
      >
        <div className="flex flex-col gap-2">
          <BeforeImage seed={gen.sourceSeed} />
          <p className="atlas-muted text-xs font-bold">{gen.sourceLabel}</p>
        </div>

        <span
          className="grid size-9 shrink-0 place-items-center self-center rounded-full"
          style={{ background: "var(--atlas-bg-muted)", color: tone }}
        >
          <ArrowRightIcon className="size-4" />
        </span>

        {/* Empty after-slot */}
        <div className="flex flex-col gap-2">
          <div
            className="flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center"
            style={{
              aspectRatio: "4 / 3",
              borderRadius: imageRadius,
              border: `1.5px dashed ${tone}`,
              background: "color-mix(in srgb, var(--atlas-bg-muted) 70%, transparent)",
            }}
          >
            <span
              className="grid size-11 place-items-center rounded-full"
              style={{ background: "var(--atlas-bg-surface)", color: tone }}
            >
              {icon}
            </span>
            <StatusPill tone={pillTone}>{pillLabel}</StatusPill>
            {gen.note ? (
              <p
                className="max-w-xs text-sm leading-relaxed"
                style={{ color: "var(--atlas-text-secondary)" }}
              >
                {gen.note}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <PromptBlock prompt={gen.prompt} />
      <ReferenceRow references={references} />
    </SectionCard>
  );
}

function RetryableState() {
  return (
    <OutcomeState
      gen={retryableGen}
      tone="var(--atlas-amber)"
      pillLabel="Retry available"
      pillTone="amber"
      icon={<ClockIcon className="size-5" />}
    />
  );
}

function BlockedState() {
  return (
    <OutcomeState
      gen={blockedGen}
      tone="var(--destructive)"
      pillLabel="Blocked"
      pillTone="destructive"
      icon={<ShieldAlertIcon className="size-5" />}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Terminal actions — the big half-and-half decisions per state        */
/* ------------------------------------------------------------------ */

function ResultBottomNav({ stateId }: { stateId: string }) {
  const bigBtn: CSSProperties = { height: 48, fontSize: 14 };

  if (stateId === "complete") {
    return (
      <MockBottomNav>
        <button className="atlas-btn atlas-btn-outline w-full" style={bigBtn} type="button">
          <CornerDownRightIcon />
          Continue editing
        </button>
        <button className="atlas-btn atlas-btn-primary w-full" style={bigBtn} type="button">
          <CheckIcon className="size-4" />
          Finish
        </button>
      </MockBottomNav>
    );
  }

  if (stateId === "retryable") {
    return (
      <MockBottomNav>
        <button className="atlas-btn atlas-btn-outline w-full" style={bigBtn} type="button">
          <SlidersHorizontalIcon />
          Edit direction
        </button>
        <button className="atlas-btn atlas-btn-primary w-full" style={bigBtn} type="button">
          <RotateCcwIcon />
          Retry generation
        </button>
      </MockBottomNav>
    );
  }

  if (stateId === "blocked") {
    return (
      <MockBottomNav>
        <button className="atlas-btn atlas-btn-outline w-full" style={bigBtn} type="button">
          <HistoryIcon />
          Back to history
        </button>
        <button className="atlas-btn atlas-btn-primary w-full" style={bigBtn} type="button">
          <SlidersHorizontalIcon />
          Rephrase direction
        </button>
      </MockBottomNav>
    );
  }

  // Generating — a single, full-width red outlined Cancel spanning both halves.
  return (
    <MockBottomNav>
      <button
        className="atlas-btn col-span-2 w-full"
        style={{
          ...bigBtn,
          border: "1px solid var(--destructive)",
          background: "transparent",
          color: "var(--destructive)",
        }}
        type="button"
      >
        <XIcon />
        Cancel generation
      </button>
    </MockBottomNav>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function GenerationResultScreen({ stateId }: MockupScreenProps) {
  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <MockTopbar breadcrumb={["Hartley — Main Bathroom", "Atlas Image"]} />

      <div className="atlas-frame flex flex-1 flex-col gap-5 py-6">
        {stateId === "complete" ? <CompleteState /> : null}
        {stateId === "retryable" ? <RetryableState /> : null}
        {stateId === "blocked" ? <BlockedState /> : null}
        {stateId !== "complete" && stateId !== "retryable" && stateId !== "blocked" ? (
          <GeneratingState />
        ) : null}
      </div>

      {/* Terminal states get big half-and-half actions in a sticky nav */}
      <ResultBottomNav stateId={stateId} />
    </div>
  );
}

export const screen: MockupScreen = {
  id: "generation-result",
  title: "Generate & result",
  description:
    "Stage 3 of Atlas Image: one concept per run, saved the instant it completes — with honest generating, complete, retryable, and blocked states.",
  viewport: "desktop",
  states: [
    { id: "generating", label: "Generating" },
    { id: "complete", label: "Complete" },
    { id: "retryable", label: "Retryable" },
    { id: "blocked", label: "Blocked" },
  ],
  Component: GenerationResultScreen,
};
