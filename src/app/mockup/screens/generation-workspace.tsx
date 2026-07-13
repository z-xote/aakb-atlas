"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  MicIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MockupScreen, MockupScreenProps } from "../types";
import {
  mockReferences,
  referenceCategories,
  type MockReference,
} from "../mock-data";
import { MockImage, MockTopbar } from "../mock-ui";

/* ------------------------------------------------------------------ */
/* Static screen copy                                                  */
/* ------------------------------------------------------------------ */

const SEEDED_SELECTION = ["ref-sage-shaker", "ref-brass-mixer"];

const TRANSCRIPT_DRAFT =
  "Swap the vanity for the sage shaker, brass tapware, and put a backlit pill mirror above it";

const thread: Array<{
  id: string;
  author: "atlas" | "user";
  time: string;
  body: string;
}> = [
  {
    id: "m-intro",
    author: "atlas",
    time: "9:31 am",
    body: "I'll edit the Vanity wall photo directly. Describe the look you're after and pin a few references on the right.",
  },
  {
    id: "m-user",
    author: "user",
    time: "9:32 am",
    body: "Wall-hung sage vanity, keep the window.",
  },
  {
    id: "m-ack",
    author: "atlas",
    time: "9:32 am",
    body: "Got it — keeping the window and wall-mounting the vanity. Add tapware and a mirror reference when you're ready, then generate one concept.",
  },
];

const stages = [
  { n: 1, label: "Source", status: "done" as const },
  { n: 2, label: "Direction & references", status: "active" as const },
  { n: 3, label: "Generate", status: "todo" as const },
];

/* deterministic waveform for the recording bar */
const waveform = Array.from({ length: 20 }, (_, i) =>
  28 + Math.round(Math.abs(Math.sin(i * 1.35 + 0.6)) * 64)
);

/* ------------------------------------------------------------------ */
/* Stage strip                                                         */
/* ------------------------------------------------------------------ */

function StageStrip() {
  return (
    <div
      className="flex items-center gap-1 overflow-x-auto rounded-lg border px-4 py-3"
      style={{
        borderColor: "var(--atlas-border)",
        background: "var(--atlas-bg-surface)",
      }}
    >
      {stages.map((stage, index) => {
        const isActive = stage.status === "active";
        const isDone = stage.status === "done";
        return (
          <div className="flex items-center gap-1" key={stage.n}>
            <div className="flex shrink-0 items-center gap-2.5">
              <span
                className="grid size-6 place-items-center rounded-full text-xs font-bold"
                style={{
                  background: isActive
                    ? "var(--atlas-accent)"
                    : isDone
                      ? "var(--atlas-accent-soft)"
                      : "var(--atlas-bg-muted)",
                  color: isActive
                    ? "#ffffff"
                    : isDone
                      ? "var(--atlas-accent)"
                      : "var(--atlas-text-tertiary)",
                }}
              >
                {isDone ? <CheckIcon className="size-3.5" /> : stage.n}
              </span>
              <span
                className="whitespace-nowrap text-sm font-bold"
                style={{
                  color: isActive
                    ? "var(--atlas-accent)"
                    : isDone
                      ? "var(--atlas-text-primary)"
                      : "var(--atlas-text-tertiary)",
                }}
              >
                {stage.label}
              </span>
            </div>
            {index < stages.length - 1 ? (
              <span
                aria-hidden="true"
                className="mx-3 h-px w-8 shrink-0"
                style={{ background: "var(--atlas-border-strong)" }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Left — chat & voice direction                                       */
/* ------------------------------------------------------------------ */

function RecordingBar() {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border p-3"
      style={{
        borderColor: "color-mix(in srgb, var(--destructive) 45%, var(--atlas-border))",
        background: "color-mix(in srgb, var(--destructive) 7%, var(--atlas-bg-muted))",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="size-2.5 shrink-0 animate-pulse rounded-full"
          style={{ background: "var(--destructive)" }}
        />
        <span
          className="text-xs font-bold uppercase tracking-normal"
          style={{ color: "var(--destructive)" }}
        >
          Recording
        </span>

        {/* live waveform */}
        <div className="flex h-8 flex-1 items-center gap-[3px] overflow-hidden">
          {waveform.map((height, i) => (
            <span
              key={i}
              className="w-1 shrink-0 animate-pulse rounded-full"
              style={{
                height: `${height}%`,
                background: "var(--atlas-accent)",
                opacity: 0.55 + (height / 100) * 0.45,
                animationDelay: `${(i % 6) * 110}ms`,
                animationDuration: "1100ms",
              }}
            />
          ))}
        </div>

        <span
          className="shrink-0 text-sm font-bold tabular-nums"
          style={{ color: "var(--atlas-text-primary)" }}
        >
          0:07
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
          Transcribed by OpenAI when you stop.
        </p>
        <button
          className="atlas-btn"
          style={{
            height: 36,
            paddingInline: 14,
            background: "var(--destructive)",
            color: "#ffffff",
          }}
          type="button"
        >
          <SquareIcon className="size-3.5" fill="currentColor" />
          Stop
        </button>
      </div>
    </div>
  );
}

function TranscriptCard({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div
      className="mb-3 flex flex-col gap-2 rounded-lg border p-3"
      style={{
        borderColor: "var(--atlas-accent-muted)",
        background: "var(--atlas-accent-soft)",
      }}
    >
      <span
        className="text-[11px] font-bold uppercase tracking-normal"
        style={{ color: "var(--atlas-accent)" }}
      >
        Voice transcript — edit before sending
      </span>
      <textarea
        className="min-h-20 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none"
        onChange={(event) => onChange(event.target.value)}
        style={{
          borderColor: "var(--atlas-border-strong)",
          background: "var(--atlas-bg-surface)",
          color: "var(--atlas-text-primary)",
        }}
        value={value}
      />
      <div className="flex items-center justify-end gap-2">
        <button
          className="atlas-btn"
          style={{ height: 34, color: "var(--atlas-text-secondary)" }}
          type="button"
        >
          <Trash2Icon className="size-3.5" />
          Discard
        </button>
        <button
          className="atlas-btn atlas-btn-primary"
          style={{ height: 34 }}
          type="button"
        >
          <SendHorizontalIcon className="size-3.5" />
          Send as direction
        </button>
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const empty = value.trim().length === 0;
  return (
    <div
      className="flex items-end gap-2 rounded-lg border p-2"
      style={{
        borderColor: "var(--atlas-border-strong)",
        background: "var(--atlas-bg-muted)",
      }}
    >
      <textarea
        className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe the change, or tap the mic to talk it through…"
        style={{ color: "var(--atlas-text-primary)" }}
        value={value}
      />
      <button
        aria-label="Record voice direction"
        className="atlas-icon-button atlas-icon-button-bordered shrink-0"
        style={{ height: 40, width: 40 }}
        type="button"
      >
        <MicIcon />
      </button>
      <button
        aria-label="Send direction"
        className="grid shrink-0 place-items-center rounded-lg transition-colors"
        disabled={empty}
        style={{
          height: 40,
          width: 40,
          background: empty ? "var(--atlas-bg-hover)" : "var(--atlas-accent)",
          color: empty ? "var(--atlas-text-tertiary)" : "#ffffff",
        }}
        type="button"
      >
        <SendHorizontalIcon className="size-4" />
      </button>
    </div>
  );
}

function ChatPanel({ stateId }: { stateId: string }) {
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState(TRANSCRIPT_DRAFT);

  return (
    <section className="atlas-simple-panel flex min-h-0 flex-col">
      {/* Pinned before-source context */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: "var(--atlas-border)" }}
      >
        <MockImage
          seed="hartley-vanity-wall"
          label="Before — Vanity wall"
          ratio="4 / 3"
          className="w-28 shrink-0"
          style={{ borderRadius: "var(--atlas-radius)" }}
        />
        <div className="min-w-0 flex-1">
          <span className="atlas-label">Editing source</span>
          <p
            className="truncate text-sm font-bold"
            style={{ color: "var(--atlas-text-primary)" }}
          >
            Vanity wall · before photo
          </p>
          <p className="truncate text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
            Captured today, 9:12 am
          </p>
        </div>
        <button
          className="atlas-btn atlas-btn-outline shrink-0"
          style={{ height: 34 }}
          type="button"
        >
          <RefreshCwIcon className="size-3.5" />
          Change source
        </button>
      </div>

      {/* Thread */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {thread.map((entry) => {
          const isUser = entry.author === "user";
          return (
            <div
              className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}
              key={entry.id}
            >
              <div
                className="max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                style={
                  isUser
                    ? {
                        background: "var(--atlas-accent-soft)",
                        color: "var(--atlas-text-primary)",
                        borderBottomRightRadius: 6,
                      }
                    : {
                        background: "var(--atlas-bg-muted)",
                        color: "var(--atlas-text-secondary)",
                        borderBottomLeftRadius: 6,
                      }
                }
              >
                {!isUser ? (
                  <span
                    className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-normal"
                    style={{ color: "var(--atlas-accent)" }}
                  >
                    <SparklesIcon className="size-3" />
                    Atlas Image
                  </span>
                ) : null}
                {entry.body}
              </div>
              <span
                className="px-1 text-[11px] font-bold"
                style={{ color: "var(--atlas-text-tertiary)" }}
              >
                {entry.time}
              </span>
            </div>
          );
        })}
      </div>

      {/* Composer area */}
      <div className="border-t p-3" style={{ borderColor: "var(--atlas-border)" }}>
        {stateId === "recording" ? (
          <RecordingBar />
        ) : (
          <>
            {stateId === "transcript" ? (
              <TranscriptCard value={transcript} onChange={setTranscript} />
            ) : null}
            <Composer value={message} onChange={setMessage} />
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Right — categorized references                                      */
/* ------------------------------------------------------------------ */

function ReferenceCard({
  reference,
  selected,
  onToggle,
}: {
  reference: MockReference;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className="relative flex flex-col overflow-hidden rounded-lg border text-left transition-colors"
      onClick={onToggle}
      style={{
        borderColor: selected ? "var(--atlas-accent)" : "var(--atlas-border)",
        background: "var(--atlas-bg-muted)",
        boxShadow: selected ? "0 0 0 2px var(--atlas-accent)" : "none",
      }}
      type="button"
    >
      <div className="relative">
        <MockImage seed={reference.seed} ratio="4 / 3" className="w-full" />
        {selected ? (
          <span
            className="absolute right-2 top-2 grid size-6 place-items-center rounded-full"
            style={{ background: "var(--atlas-accent)", color: "#ffffff" }}
          >
            <CheckIcon className="size-3.5" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5 p-2">
        <p
          className="truncate text-xs font-bold"
          style={{ color: "var(--atlas-text-primary)" }}
        >
          {reference.label}
        </p>
        <p
          className="truncate text-[10px] font-bold"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          {reference.tags.join(" · ")}
        </p>
      </div>
    </button>
  );
}

function ReferencesPanel({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState("vanities");

  const visible = useMemo(
    () => mockReferences.filter((ref) => ref.category === activeCategory),
    [activeCategory]
  );

  const selectedRefs = useMemo(
    () =>
      selected
        .map((id) => mockReferences.find((ref) => ref.id === id))
        .filter((ref): ref is MockReference => Boolean(ref)),
    [selected]
  );

  return (
    <section className="atlas-simple-panel flex min-h-0 flex-col">
      {/* Category tabs */}
      <div
        className="border-b px-3 py-2.5"
        style={{ borderColor: "var(--atlas-border)" }}
      >
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {referenceCategories.map((category) => {
            const active = category.slug === activeCategory;
            const count = mockReferences.filter(
              (ref) => ref.category === category.slug
            ).length;
            return (
              <button
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors"
                key={category.slug}
                onClick={() => setActiveCategory(category.slug)}
                style={{
                  borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)",
                  background: active
                    ? "var(--atlas-accent-soft)"
                    : "var(--atlas-bg-surface)",
                  color: active
                    ? "var(--atlas-accent)"
                    : "var(--atlas-text-secondary)",
                }}
                type="button"
              >
                {category.label}
                <span
                  className="text-[10px]"
                  style={{ color: "var(--atlas-text-tertiary)" }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reference grid */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          {visible.map((reference) => (
            <ReferenceCard
              key={reference.id}
              onToggle={() => onToggle(reference.id)}
              reference={reference}
              selected={selected.includes(reference.id)}
            />
          ))}
        </div>
      </div>

      {/* Pinned selection tray */}
      <div
        className="border-t p-3"
        style={{ borderColor: "var(--atlas-border)" }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="atlas-label">
            {selectedRefs.length > 0
              ? `${selectedRefs.length} reference${selectedRefs.length === 1 ? "" : "s"} selected`
              : "References"}
          </span>
          <span className="text-[11px] font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
            Optional — recommended
          </span>
        </div>

        {selectedRefs.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedRefs.map((reference) => (
              <div className="relative shrink-0" key={reference.id}>
                <MockImage
                  seed={reference.seed}
                  ratio="1 / 1"
                  className="w-12"
                  style={{ borderRadius: "var(--atlas-radius)" }}
                />
                <button
                  aria-label={`Remove ${reference.label}`}
                  className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border"
                  onClick={() => onToggle(reference.id)}
                  style={{
                    borderColor: "var(--atlas-border)",
                    background: "var(--atlas-bg-surface)",
                    color: "var(--atlas-text-secondary)",
                  }}
                  type="button"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex h-12 items-center justify-center rounded-lg border border-dashed px-3 text-center text-xs font-bold"
            style={{
              borderColor: "var(--atlas-border-strong)",
              color: "var(--atlas-text-tertiary)",
            }}
          >
            No references yet — optional but recommended.
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function GenerationWorkspaceScreen({ stateId }: MockupScreenProps) {
  const [selected, setSelected] = useState<string[]>(SEEDED_SELECTION);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ background: "var(--atlas-bg-root)", color: "var(--atlas-text-primary)" }}
    >
      <MockTopbar breadcrumb={["Hartley — Main Bathroom", "Atlas Image"]} />

      <main className="atlas-frame flex flex-1 flex-col gap-4 py-6">
        <StageStrip />

        <div
          className="grid min-h-0 flex-1 gap-4"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.95fr)",
            minHeight: 560,
          }}
        >
          <ChatPanel stateId={stateId} />
          <ReferencesPanel onToggle={toggle} selected={selected} />
        </div>

        {/* Footer bar spanning both columns */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3"
          style={{
            borderColor: "var(--atlas-border)",
            background: "var(--atlas-bg-surface)",
          }}
        >
          <p className="text-sm font-bold" style={{ color: "var(--atlas-text-secondary)" }}>
            1 before photo · {selected.length} reference{selected.length === 1 ? "" : "s"} · 1
            concept will be generated
          </p>
          <button
            className="atlas-btn atlas-btn-primary"
            style={{ height: 44, paddingInline: 22, fontSize: 14 }}
            type="button"
          >
            <SparklesIcon className="size-4" />
            Generate concept
          </button>
        </div>
      </main>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "generation-workspace",
  title: "Direction & references (desktop)",
  description:
    "Stage 2 of Atlas Image on desktop: chat & voice direction on the left, categorized references on the right, generate one concept.",
  viewport: "desktop",
  states: [
    { id: "idle", label: "Typing" },
    { id: "recording", label: "Recording voice" },
    { id: "transcript", label: "Transcript ready" },
  ],
  Component: GenerationWorkspaceScreen,
};
