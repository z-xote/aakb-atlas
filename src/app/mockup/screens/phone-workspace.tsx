"use client";

import { type CSSProperties, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  MicIcon,
  PencilIcon,
  SendHorizontalIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MockupScreen, MockupScreenProps } from "../types";
import {
  activeFile,
  mockReferences,
  referenceCategories,
  type MockReference,
} from "../mock-data";
import { MockBottomNav, MockImage } from "../mock-ui";

type SubStage = "references" | "direction";

const stageMeta: Record<SubStage, { label: string; step: string }> = {
  references: { label: "References", step: "Step 2 of 3" },
  direction: { label: "Direction", step: "Step 3 of 3" },
};

/**
 * Constrain the shared {@link MockBottomNav} — whose inner uses `.atlas-frame`
 * (`min(--atlas-frame-max, 100vw - gutter)`) — to the device frame instead of
 * the surrounding desktop viewport. Both are relative units, so this works for
 * the 393 px and 844 px frames alike, giving a full-bleed bar with a small
 * inset and no horizontal overflow inside the phone.
 */
const frameVars = {
  "--atlas-frame-max": "calc(100% - 32px)",
  "--atlas-frame-gutter": "0px",
} as CSSProperties;

function selectRefs(ids: string[]): MockReference[] {
  return ids
    .map((id) => mockReferences.find((ref) => ref.id === id))
    .filter((ref): ref is MockReference => Boolean(ref));
}

/* ------------------------------------------------------------------ */
/* Mobile header — one back affordance + identity + compact progress   */
/* ------------------------------------------------------------------ */

function MobileHeader({
  subStage,
  isLandscape,
  onBack,
}: {
  subStage: SubStage;
  isLandscape: boolean;
  onBack: () => void;
}) {
  const meta = stageMeta[subStage];

  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-3 border-b px-3",
        isLandscape ? "h-12" : "h-14",
      )}
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

      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span
          className="text-[11px] font-bold uppercase tracking-normal"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          Atlas Image
        </span>
        <strong className="truncate text-sm font-bold">{activeFile.title}</strong>
      </div>

      <div className="flex shrink-0 flex-col items-end leading-tight text-right">
        <strong
          className="text-[13px] font-bold"
          style={{ color: "var(--atlas-accent)" }}
        >
          {meta.label}
        </strong>
        <span
          className="text-[11px] font-bold"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          {meta.step}
        </span>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Shared atoms                                                        */
/* ------------------------------------------------------------------ */

function CategoryChips({
  category,
  onSelect,
}: {
  category: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div
      className="flex shrink-0 gap-1.5 overflow-x-auto border-b px-3 py-2.5"
      style={{ borderColor: "var(--atlas-border)" }}
    >
      {referenceCategories.map((cat) => {
        const active = cat.slug === category;
        const count = mockReferences.filter(
          (ref) => ref.category === cat.slug,
        ).length;
        return (
          <button
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors"
            key={cat.slug}
            onClick={() => onSelect(cat.slug)}
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
            {cat.label}
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
  );
}

function CategoryRail({
  category,
  onSelect,
}: {
  category: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <nav
      className="flex w-[168px] shrink-0 flex-col gap-1 overflow-y-auto border-r p-2"
      style={{ borderColor: "var(--atlas-border)" }}
    >
      {referenceCategories.map((cat) => {
        const active = cat.slug === category;
        const count = mockReferences.filter(
          (ref) => ref.category === cat.slug,
        ).length;
        return (
          <button
            className="flex h-9 shrink-0 items-center justify-between rounded-md px-3 text-left text-[13px] font-bold transition-colors"
            key={cat.slug}
            onClick={() => onSelect(cat.slug)}
            style={{
              background: active ? "var(--atlas-accent-soft)" : "transparent",
              color: active
                ? "var(--atlas-accent)"
                : "var(--atlas-text-secondary)",
            }}
            type="button"
          >
            {cat.label}
            <span
              className="text-[11px]"
              style={{ color: "var(--atlas-text-tertiary)" }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

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

function ReferenceGrid({
  items,
  selected,
  onToggle,
  columns,
}: {
  items: MockReference[];
  selected: string[];
  onToggle: (id: string) => void;
  columns: number;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      {items.length > 0 ? (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {items.map((reference) => (
            <ReferenceCard
              key={reference.id}
              onToggle={() => onToggle(reference.id)}
              reference={reference}
              selected={selected.includes(reference.id)}
            />
          ))}
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
  );
}

function SelectedTray({
  selectedRefs,
  onClear,
}: {
  selectedRefs: MockReference[];
  onClear: (id: string) => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-3 border-t px-3 py-2.5"
      style={{
        borderColor: "var(--atlas-border)",
        background: "var(--atlas-bg-surface)",
      }}
    >
      <span
        className="shrink-0 text-[12px] font-bold"
        style={{ color: "var(--atlas-text-secondary)" }}
      >
        {selectedRefs.length} selected
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        {selectedRefs.length === 0 ? (
          <span
            className="text-[12px] font-bold"
            style={{ color: "var(--atlas-text-tertiary)" }}
          >
            Pick a few to guide the concept
          </span>
        ) : (
          selectedRefs.map((ref) => (
            <span className="relative shrink-0 pr-1.5 pt-1.5" key={ref.id}>
              <span
                className="block size-10 overflow-hidden rounded-md"
                style={{ border: "1px solid var(--atlas-border)" }}
              >
                <MockImage seed={ref.seed} ratio="1 / 1" className="size-full" />
              </span>
              <button
                aria-label={`Remove ${ref.label}`}
                className="absolute right-0 top-0 grid size-5 place-items-center rounded-full border transition-colors"
                onClick={() => onClear(ref.id)}
                style={{
                  borderColor: "var(--atlas-border)",
                  background: "var(--atlas-bg-surface)",
                  color: "var(--atlas-text-secondary)",
                }}
                type="button"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* References sub-stage                                                 */
/* ------------------------------------------------------------------ */

function ReferencesStage({
  isLandscape,
  category,
  onCategory,
  selected,
  onToggle,
  onClear,
}: {
  isLandscape: boolean;
  category: string;
  onCategory: (slug: string) => void;
  selected: string[];
  onToggle: (id: string) => void;
  onClear: (id: string) => void;
}) {
  const items = useMemo(
    () => mockReferences.filter((ref) => ref.category === category),
    [category],
  );
  const selectedRefs = useMemo(() => selectRefs(selected), [selected]);

  if (isLandscape) {
    // Denser split: vertical category rail beside the grid, tray pinned under it.
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <CategoryRail category={category} onSelect={onCategory} />
          <div className="flex min-w-0 flex-1 flex-col">
            <ReferenceGrid
              columns={3}
              items={items}
              onToggle={onToggle}
              selected={selected}
            />
          </div>
        </div>
        <SelectedTray onClear={onClear} selectedRefs={selectedRefs} />
      </div>
    );
  }

  // Portrait: one vertical stage — chips, two-column grid, compact tray.
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CategoryChips category={category} onSelect={onCategory} />
      <ReferenceGrid
        columns={2}
        items={items}
        onToggle={onToggle}
        selected={selected}
      />
      <SelectedTray onClear={onClear} selectedRefs={selectedRefs} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Direction sub-stage                                                 */
/* ------------------------------------------------------------------ */

function SourceCard() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <MockImage
        seed="hartley-vanity-wall"
        label="Before"
        ratio="4 / 3"
        className="w-24 shrink-0"
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
        <p
          className="truncate text-xs font-bold"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          Captured today, 9:12 am
        </p>
      </div>
    </div>
  );
}

function SelectedRefsRow({
  selectedRefs,
  onEdit,
}: {
  selectedRefs: MockReference[];
  onEdit: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="atlas-label">Refs · {selectedRefs.length}</span>
        <button
          className="inline-flex items-center gap-1 text-[12px] font-bold transition-colors"
          onClick={onEdit}
          style={{ color: "var(--atlas-accent)" }}
          type="button"
        >
          <PencilIcon className="size-3.5" />
          Edit
        </button>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
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
              className="size-10 shrink-0 overflow-hidden rounded-md"
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
  );
}

function DirectionThread({ selectedRefs }: { selectedRefs: MockReference[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="atlas-label">Direction</span>
      <div className="flex justify-end">
        <p
          className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-[13px] leading-relaxed"
          style={{ background: "var(--atlas-accent)", color: "#ffffff" }}
        >
          Replace the vanity with a sage shaker wall-hung unit, brass mixer, keep
          the window light.
        </p>
      </div>
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
          {selectedRefs.length === 1 ? "" : "s"}. Add anything else, or generate
          the concept.
        </p>
      </div>
    </div>
  );
}

function Composer({
  draft,
  onDraft,
}: {
  draft: string;
  onDraft: (next: string) => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 border-t p-2.5"
      style={{
        borderColor: "var(--atlas-border)",
        background: "var(--atlas-bg-surface)",
      }}
    >
      <textarea
        className="h-11 min-w-0 flex-1 resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none transition-colors"
        onChange={(event) => onDraft(event.target.value)}
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
        aria-label="Send direction"
        className="grid size-11 shrink-0 place-items-center rounded-lg transition-colors"
        disabled={draft.trim().length === 0}
        style={{
          background:
            draft.trim().length === 0
              ? "var(--atlas-bg-muted)"
              : "var(--atlas-accent)",
          color:
            draft.trim().length === 0
              ? "var(--atlas-text-tertiary)"
              : "#ffffff",
        }}
        type="button"
      >
        <SendHorizontalIcon className="size-4" />
      </button>
    </div>
  );
}

function DirectionStage({
  isLandscape,
  selected,
  draft,
  onDraft,
  onEditRefs,
}: {
  isLandscape: boolean;
  selected: string[];
  draft: string;
  onDraft: (next: string) => void;
  onEditRefs: () => void;
}) {
  const selectedRefs = useMemo(() => selectRefs(selected), [selected]);

  if (isLandscape) {
    // Denser split: source + refs context on the left, thread + composer right.
    return (
      <div className="flex min-h-0 flex-1">
        <aside
          className="flex w-[260px] shrink-0 flex-col gap-3 overflow-y-auto border-r p-3"
          style={{ borderColor: "var(--atlas-border)" }}
        >
          <SourceCard />
          <SelectedRefsRow onEdit={onEditRefs} selectedRefs={selectedRefs} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <DirectionThread selectedRefs={selectedRefs} />
          </div>
          <Composer draft={draft} onDraft={onDraft} />
        </div>
      </div>
    );
  }

  // Portrait: one full-width vertical stage.
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <SourceCard />
        <SelectedRefsRow onEdit={onEditRefs} selectedRefs={selectedRefs} />
        <DirectionThread selectedRefs={selectedRefs} />
      </div>
      <Composer draft={draft} onDraft={onDraft} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function PhoneWorkspaceScreen({ stateId, viewport }: MockupScreenProps) {
  const isLandscape = viewport === "phone-landscape";

  const [subStage, setSubStage] = useState<SubStage>(
    stateId === "direction" ? "direction" : "references",
  );
  const [selected, setSelected] = useState<string[]>([
    "ref-sage-shaker",
    "ref-brass-mixer",
    "ref-pill-mirror",
  ]);
  const [category, setCategory] = useState(referenceCategories[0].slug);
  const [draft, setDraft] = useState("");

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
        ...frameVars,
      }}
    >
      <MobileHeader
        isLandscape={isLandscape}
        onBack={() =>
          subStage === "direction" ? setSubStage("references") : undefined
        }
        subStage={subStage}
      />

      {subStage === "references" ? (
        <ReferencesStage
          category={category}
          isLandscape={isLandscape}
          onCategory={setCategory}
          onClear={clear}
          onToggle={toggle}
          selected={selected}
        />
      ) : (
        <DirectionStage
          draft={draft}
          isLandscape={isLandscape}
          onDraft={setDraft}
          onEditRefs={() => setSubStage("references")}
          selected={selected}
        />
      )}

      {subStage === "references" ? (
        <MockBottomNav>
          <button
            className="atlas-btn atlas-btn-outline w-full"
            style={{ height: 48, fontSize: 14 }}
            type="button"
          >
            <ArrowLeftIcon className="size-4" />
            Back to source
          </button>
          <button
            className="atlas-btn atlas-btn-primary w-full"
            onClick={() => setSubStage("direction")}
            style={{ height: 48, fontSize: 14 }}
            type="button"
          >
            {isLandscape ? "Continue to direction" : "Continue"}
            <ArrowRightIcon className="size-4" />
          </button>
        </MockBottomNav>
      ) : (
        <MockBottomNav>
          <button
            className="atlas-btn atlas-btn-outline w-full"
            onClick={() => setSubStage("references")}
            style={{ height: 48, fontSize: 14 }}
            type="button"
          >
            <PencilIcon className="size-4" />
            Edit references
          </button>
          <button
            className="atlas-btn atlas-btn-primary w-full"
            style={{ height: 48, fontSize: 14 }}
            type="button"
          >
            <SparklesIcon className="size-4" />
            {isLandscape ? "Generate concept" : "Generate"}
          </button>
        </MockBottomNav>
      )}
    </div>
  );
}

export const screen: MockupScreen = {
  id: "phone-workspace",
  title: "Direction & references (mobile)",
  description:
    "Atlas Image on a phone as a calm, reversible pipeline: pick references, then give direction, with a two-action bottom bar to move back and forward. Portrait is one focused stage at a time; landscape keeps a denser split.",
  viewport: "phone",
  states: [
    { id: "references", label: "References stage" },
    { id: "direction", label: "Direction stage" },
  ],
  Component: PhoneWorkspaceScreen,
};
