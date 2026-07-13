"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  MicIcon,
  PencilIcon,
  SendHorizontalIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

import type { MockupScreen, MockupScreenProps } from "../types";
import {
  activeFile,
  mockReferences,
  referenceCategories,
} from "../mock-data";
import { MockImage } from "../mock-ui";

type SubStage = "references" | "chat";

const stageDots: Array<{ key: string; label: string }> = [
  { key: "source", label: "Source" },
  { key: "references", label: "References" },
  { key: "direction", label: "Direction" },
  { key: "generate", label: "Generate" },
];

/* ------------------------------------------------------------------ */
/* Slim header — shared across both sub-stages                         */
/* ------------------------------------------------------------------ */

function SlimHeader({
  subStage,
  onBack,
}: {
  subStage: SubStage;
  onBack: () => void;
}) {
  const activeDot = subStage === "references" ? "references" : "direction";

  return (
    <header
      className="flex h-11 shrink-0 items-center gap-3 border-b px-3"
      style={{
        borderColor: "var(--atlas-border)",
        background: "var(--atlas-bg-surface)",
      }}
    >
      <button
        aria-label="Back"
        className="atlas-icon-button atlas-icon-button-bordered shrink-0"
        onClick={onBack}
        type="button"
      >
        <ChevronLeftIcon />
      </button>

      <div className="flex min-w-0 flex-col leading-tight">
        <strong className="truncate text-sm font-bold">
          Atlas Image — Hartley
        </strong>
        <span
          className="truncate text-[11px] font-bold"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          {activeFile.title}
        </span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {stageDots.map((dot, index) => {
          const isDone = dot.key === "source";
          const isActive = dot.key === activeDot;
          return (
            <span className="flex items-center gap-1.5" key={dot.key}>
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="text-[10px]"
                  style={{ color: "var(--atlas-text-tertiary)" }}
                >
                  ·
                </span>
              ) : null}
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold"
                style={{
                  color: isActive
                    ? "var(--atlas-accent)"
                    : isDone
                      ? "var(--atlas-green)"
                      : "var(--atlas-text-tertiary)",
                }}
              >
                {isDone ? <CheckIcon className="size-3" /> : null}
                {dot.label}
              </span>
            </span>
          );
        })}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* References sub-stage                                                 */
/* ------------------------------------------------------------------ */

function ReferencesStage({
  selected,
  onToggle,
  onClear,
  onNext,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onClear: (id: string) => void;
  onNext: () => void;
}) {
  const [category, setCategory] = useState(referenceCategories[0].slug);

  const items = useMemo(
    () => mockReferences.filter((ref) => ref.category === category),
    [category],
  );
  const selectedRefs = useMemo(
    () =>
      selected
        .map((id) => mockReferences.find((ref) => ref.id === id))
        .filter((ref): ref is (typeof mockReferences)[number] => Boolean(ref)),
    [selected],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Category rail */}
        <nav
          className="flex w-[128px] shrink-0 flex-col gap-1 overflow-y-auto border-r p-2"
          style={{ borderColor: "var(--atlas-border)" }}
        >
          {referenceCategories.map((cat) => {
            const active = cat.slug === category;
            return (
              <button
                className="flex h-9 shrink-0 items-center rounded-md px-3 text-left text-[13px] font-bold transition-colors"
                key={cat.slug}
                onClick={() => setCategory(cat.slug)}
                style={{
                  background: active
                    ? "var(--atlas-accent-soft)"
                    : "transparent",
                  color: active
                    ? "var(--atlas-accent)"
                    : "var(--atlas-text-secondary)",
                }}
                type="button"
              >
                {cat.label}
              </button>
            );
          })}
        </nav>

        {/* Reference cards */}
        <div className="min-w-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="atlas-label">
              {referenceCategories.find((c) => c.slug === category)?.label} ·{" "}
              {items.length}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: "var(--atlas-text-tertiary)" }}
            >
              Tap to add references
            </span>
          </div>

          {items.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {items.map((ref) => {
                const isSelected = selected.includes(ref.id);
                return (
                  <button
                    className="group relative w-[120px] shrink-0 overflow-hidden rounded-lg text-left transition-all"
                    key={ref.id}
                    onClick={() => onToggle(ref.id)}
                    style={{
                      outline: isSelected
                        ? "2px solid var(--atlas-accent)"
                        : "1px solid var(--atlas-border)",
                      outlineOffset: isSelected ? "-2px" : "-1px",
                    }}
                    type="button"
                  >
                    <MockImage
                      seed={ref.seed}
                      ratio="4 / 3"
                      className="w-full"
                    />
                    {isSelected ? (
                      <span
                        className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full"
                        style={{
                          background: "var(--atlas-accent)",
                          color: "#ffffff",
                        }}
                      >
                        <CheckIcon className="size-3.5" />
                      </span>
                    ) : null}
                    <span
                      className="block truncate px-2 py-1.5 text-[12px] font-bold"
                      style={{
                        background: "var(--atlas-bg-surface)",
                        color: "var(--atlas-text-primary)",
                      }}
                    >
                      {ref.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="grid h-24 place-items-center rounded-lg border border-dashed text-[13px] font-bold"
              style={{
                borderColor: "var(--atlas-border-strong)",
                color: "var(--atlas-text-tertiary)",
              }}
            >
              No references in this category yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar: tray + next */}
      <div
        className="flex h-[54px] shrink-0 items-center gap-3 border-t px-3"
        style={{
          borderColor: "var(--atlas-border)",
          background: "var(--atlas-bg-surface)",
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="shrink-0 text-[12px] font-bold"
            style={{ color: "var(--atlas-text-secondary)" }}
          >
            {selectedRefs.length} selected
          </span>
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
            {selectedRefs.length === 0 ? (
              <span
                className="text-[12px] font-bold"
                style={{ color: "var(--atlas-text-tertiary)" }}
              >
                Pick a few to guide the concept
              </span>
            ) : (
              selectedRefs.map((ref) => (
                <span
                  className="relative size-9 shrink-0 overflow-hidden rounded-md"
                  key={ref.id}
                  style={{ border: "1px solid var(--atlas-border)" }}
                >
                  <MockImage seed={ref.seed} ratio="1 / 1" className="size-full" />
                  <button
                    aria-label={`Remove ${ref.label}`}
                    className="absolute inset-0 grid place-items-center opacity-0 transition-opacity hover:opacity-100"
                    onClick={() => onClear(ref.id)}
                    style={{ background: "rgba(12,10,9,0.55)", color: "#fafaf9" }}
                    type="button"
                  >
                    <XIcon className="size-4" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        <button
          className="atlas-btn atlas-btn-primary h-10! shrink-0 px-4"
          onClick={onNext}
          type="button"
        >
          Next: direction
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chat / direction sub-stage                                          */
/* ------------------------------------------------------------------ */

function ChatStage({
  selected,
  onEditRefs,
}: {
  selected: string[];
  onEditRefs: () => void;
}) {
  const [draft, setDraft] = useState("");
  const selectedRefs = useMemo(
    () =>
      selected
        .map((id) => mockReferences.find((ref) => ref.id === id))
        .filter((ref): ref is (typeof mockReferences)[number] => Boolean(ref)),
    [selected],
  );

  return (
    <div className="flex min-h-0 flex-1">
      {/* Left third — pinned before + refs strip */}
      <aside
        className="flex w-[240px] shrink-0 flex-col gap-2 border-r p-3"
        style={{ borderColor: "var(--atlas-border)" }}
      >
        <MockImage
          seed="hartley-vanity-wall"
          label="Before"
          ratio="4 / 3"
          className="w-full shrink-0"
          style={{ borderRadius: "var(--atlas-radius)" }}
        />

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="atlas-label">Refs · {selectedRefs.length}</span>
            <button
              className="inline-flex items-center gap-1 text-[12px] font-bold transition-colors"
              onClick={onEditRefs}
              style={{ color: "var(--atlas-accent)" }}
              type="button"
            >
              <PencilIcon className="size-3.5" />
              Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 overflow-y-auto">
            {selectedRefs.length === 0 ? (
              <span
                className="text-[12px] font-bold"
                style={{ color: "var(--atlas-text-tertiary)" }}
              >
                No references picked
              </span>
            ) : (
              selectedRefs.map((ref) => (
                <span
                  className="size-9 shrink-0 overflow-hidden rounded-md"
                  key={ref.id}
                  style={{ border: "1px solid var(--atlas-border)" }}
                  title={ref.label}
                >
                  <MockImage seed={ref.seed} ratio="1 / 1" className="size-full" />
                </span>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Right two-thirds — thread + composer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <span className="atlas-label">Direction</span>
          <div className="mt-2 flex flex-col gap-2">
            {/* Prior user message */}
            <div className="flex justify-end">
              <p
                className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-[13px] leading-relaxed"
                style={{ background: "var(--atlas-accent)", color: "#ffffff" }}
              >
                Replace the vanity with a sage shaker wall-hung unit, brass mixer,
                keep the window light.
              </p>
            </div>
            {/* Atlas reply */}
            <div className="flex justify-start">
              <p
                className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-[13px] leading-relaxed"
                style={{
                  background: "var(--atlas-bg-muted)",
                  color: "var(--atlas-text-secondary)",
                }}
              >
                Got it — I&apos;ll keep the natural light and pull tones from your{" "}
                {selectedRefs.length} reference
                {selectedRefs.length === 1 ? "" : "s"}. Add anything else, or
                generate the concept.
              </p>
            </div>
          </div>
        </div>

        {/* Composer */}
        <div
          className="flex shrink-0 items-center gap-2 border-t p-2.5"
          style={{
            borderColor: "var(--atlas-border)",
            background: "var(--atlas-bg-surface)",
          }}
        >
          <textarea
            className="h-11 min-w-0 flex-1 resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none transition-colors"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add direction…"
            rows={1}
            style={{
              borderColor: "var(--atlas-border-strong)",
              background: "var(--atlas-bg-muted)",
              color: "var(--atlas-text-primary)",
            }}
            value={draft}
          />
          <button
            aria-label="Voice input"
            className="atlas-icon-button atlas-icon-button-bordered size-11! shrink-0"
            type="button"
          >
            <MicIcon />
          </button>
          <button
            aria-label="Send"
            className="grid size-11 shrink-0 place-items-center rounded-lg transition-colors"
            style={{ background: "var(--atlas-bg-muted)", color: "var(--atlas-text-secondary)" }}
            type="button"
          >
            <SendHorizontalIcon className="size-4" />
          </button>
          <button
            className="atlas-btn atlas-btn-primary h-11! shrink-0 px-4"
            type="button"
          >
            <SparklesIcon />
            Generate concept
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PhoneWorkspaceScreen({ stateId }: MockupScreenProps) {
  const [subStage, setSubStage] = useState<SubStage>(
    stateId === "chat" ? "chat" : "references",
  );
  const [selected, setSelected] = useState<string[]>([
    "ref-sage-shaker",
    "ref-brass-mixer",
    "ref-pill-mirror",
  ]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const clear = (id: string) =>
    setSelected((prev) => prev.filter((x) => x !== id));

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <SlimHeader
        subStage={subStage}
        onBack={() =>
          subStage === "chat" ? setSubStage("references") : undefined
        }
      />

      {subStage === "references" ? (
        <ReferencesStage
          selected={selected}
          onToggle={toggle}
          onClear={clear}
          onNext={() => setSubStage("chat")}
        />
      ) : (
        <ChatStage
          selected={selected}
          onEditRefs={() => setSubStage("references")}
        />
      )}
    </div>
  );
}

export const screen: MockupScreen = {
  id: "phone-workspace",
  title: "Direction & references (phone landscape)",
  description:
    "On phones held landscape the desktop split becomes two sequential sub-stages — pick references first, then chat direction — with real in-screen navigation between them.",
  viewport: "phone-landscape",
  states: [
    { id: "references", label: "References stage" },
    { id: "chat", label: "Chat stage" },
  ],
  Component: PhoneWorkspaceScreen,
};
