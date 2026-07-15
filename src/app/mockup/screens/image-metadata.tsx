"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CameraIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  GitBranchIcon,
  LinkIcon,
  PlusIcon,
  SparklesIcon,
  TagIcon,
  TerminalIcon,
  UploadIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { fileImageKindLabels } from "@/types/atlas";
import type { MockupScreen, MockupScreenProps } from "../types";
import {
  clockPositionHints,
  mockAssets,
  mockGenerations,
  roomChoices,
  type ClockPosition,
  type MockAsset,
  type MockAssetOrigin,
} from "../mock-data";
import { ClockDial, MockImage, MockTopbar, StatusPill, TagChip } from "../mock-ui";

const CDN_ORIGIN = "https://cdn.aakb.dev/";

/** Jump back to the file's Site images gallery (frame 7). */
function openSiteImagesFrame() {
  window.location.hash = "file-details/images";
}

const originLabels: Record<MockAssetOrigin, string> = {
  camera: "Captured on site camera",
  upload: "Uploaded from device",
  generated: "Produced by Atlas Image",
};

const originIcons: Record<MockAssetOrigin, LucideIcon> = {
  camera: CameraIcon,
  upload: UploadIcon,
  generated: SparklesIcon,
};

function findAsset(id: string): MockAsset {
  const asset = mockAssets.find((item) => item.id === id);
  if (!asset) {
    throw new Error(`Missing mock asset: ${id}`);
  }
  return asset;
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

/** Marks a field the AI agent can also set from the terminal. */
function AgentField() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none"
      style={{
        borderColor: "var(--atlas-border)",
        background: "var(--atlas-bg-muted)",
        color: "var(--atlas-text-tertiary)",
      }}
      title="The AI agent can set this field from the terminal"
    >
      <TerminalIcon className="size-3" />
      CLI
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="atlas-label">{children}</span>
      <AgentField />
    </div>
  );
}

const textInputBase =
  "h-11 w-full border px-3 text-sm outline-none transition-colors";
const textInputStyle: React.CSSProperties = {
  borderColor: "var(--atlas-border-strong)",
  borderRadius: "var(--atlas-radius)",
  background: "var(--atlas-bg-muted)",
  color: "var(--atlas-text-primary)",
};
function focusAccent(event: React.FocusEvent<HTMLInputElement>) {
  event.currentTarget.style.borderColor = "var(--atlas-accent)";
}
function blurAccent(event: React.FocusEvent<HTMLInputElement>) {
  event.currentTarget.style.borderColor = "var(--atlas-border-strong)";
}

function CopyRow({
  icon: Icon,
  caption,
  value,
}: {
  icon: LucideIcon;
  caption: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    setCopied(true);
    void navigator.clipboard?.writeText(value).catch(() => undefined);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex items-center gap-2">
      <Icon
        className="size-3.5 shrink-0"
        style={{ color: "var(--atlas-text-tertiary)" }}
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className="text-[10px] font-bold uppercase"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          {caption}
        </span>
        <span className="truncate font-mono text-xs" title={value}>
          {value}
        </span>
      </span>
      <button
        aria-label={`Copy ${caption}`}
        className="atlas-icon-button atlas-icon-button-bordered ml-auto shrink-0 size-7"
        onClick={onCopy}
        type="button"
      >
        {copied ? (
          <CheckIcon style={{ color: "var(--atlas-green)" }} />
        ) : (
          <CopyIcon />
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editor (keyed by state so edits reset when switching variant)       */
/* ------------------------------------------------------------------ */

function MetadataEditor({
  asset,
  isGenerated,
}: {
  asset: MockAsset;
  isGenerated: boolean;
}) {
  const initialRoom = typeof asset.room === "string" ? asset.room : "";
  const isKnownRoom = (roomChoices as readonly string[]).includes(initialRoom);

  const [label, setLabel] = useState(asset.label);
  const [room, setRoom] = useState<string>(isKnownRoom ? initialRoom : "");
  const [customRoom, setCustomRoom] = useState(isKnownRoom ? "" : initialRoom);
  const [customRoomOpen, setCustomRoomOpen] = useState(!isKnownRoom && initialRoom !== "");
  const [clock, setClock] = useState<ClockPosition | null>(asset.clock ?? null);
  const [tags, setTags] = useState<string[]>(asset.tags);
  const [newTag, setNewTag] = useState("");

  const lineage = mockGenerations.find((gen) => gen.id === "gen-terrazzo-2");

  const addTag = () => {
    const value = newTag.trim();
    if (value && !tags.includes(value)) {
      setTags((prev) => [...prev, value]);
    }
    setNewTag("");
  };

  return (
    <div className="grid gap-5">
      {/* Label */}
      <div className="grid gap-2">
        <FieldLabel>Label</FieldLabel>
        <input
          className={textInputBase}
          style={textInputStyle}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          onFocus={focusAccent}
          onBlur={blurAccent}
          placeholder="Vanity wall"
        />
      </div>

      {/* Room / area */}
      <div className="grid gap-2">
        <FieldLabel>Room / area</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {roomChoices.map((choice) => {
            const active = !customRoomOpen && room === choice;
            return (
              <button
                key={choice}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setRoom(choice);
                  setCustomRoomOpen(false);
                }}
                className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-bold transition-colors"
                style={{
                  borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)",
                  background: active
                    ? "var(--atlas-accent-soft)"
                    : "var(--atlas-bg-surface)",
                  color: active
                    ? "var(--atlas-accent)"
                    : "var(--atlas-text-secondary)",
                }}
              >
                {choice}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={customRoomOpen}
            onClick={() => {
              setCustomRoomOpen(true);
              setRoom("");
            }}
            className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold transition-colors"
            style={{
              borderColor: customRoomOpen
                ? "var(--atlas-accent)"
                : "var(--atlas-border)",
              background: customRoomOpen
                ? "var(--atlas-accent-soft)"
                : "var(--atlas-bg-surface)",
              color: customRoomOpen
                ? "var(--atlas-accent)"
                : "var(--atlas-text-secondary)",
            }}
          >
            <PlusIcon className="size-3.5" />
            Custom…
          </button>
        </div>
        {customRoomOpen ? (
          <input
            className={textInputBase}
            style={textInputStyle}
            value={customRoom}
            onChange={(event) => setCustomRoom(event.target.value)}
            onFocus={focusAccent}
            onBlur={blurAccent}
            placeholder="e.g. Butler's pantry"
            autoFocus
          />
        ) : null}
        <p className="text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
          Optional — set it now or leave it for later.
        </p>
      </div>

      {/* Direction OR lineage */}
      {isGenerated ? (
        <div
          className="grid gap-3 rounded-lg border p-3"
          style={{
            borderColor: "var(--atlas-border)",
            background: "var(--atlas-bg-muted)",
          }}
        >
          <div className="flex items-center gap-2">
            <GitBranchIcon
              className="size-4"
              style={{ color: "var(--atlas-accent)" }}
            />
            <span className="atlas-label">Generation lineage</span>
            <StatusPill tone="muted" className="ml-auto">
              Read-only
            </StatusPill>
          </div>
          {lineage ? (
            <>
              <div className="flex items-start gap-3">
                <MockImage
                  seed={lineage.sourceSeed}
                  ratio="4 / 3"
                  className="w-24 shrink-0 rounded-md"
                />
                <div className="min-w-0">
                  <span
                    className="text-[10px] font-bold uppercase"
                    style={{ color: "var(--atlas-text-tertiary)" }}
                  >
                    Generated from
                  </span>
                  <p
                    className="truncate text-sm font-bold"
                    style={{ color: "var(--atlas-text-primary)" }}
                  >
                    {lineage.sourceLabel}
                  </p>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: "var(--atlas-text-secondary)" }}
                  >
                    “{lineage.prompt}”
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="atlas-btn atlas-btn-outline w-full justify-center"
              >
                <ArrowUpRightIcon />
                Open generation
              </button>
            </>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-2">
          <FieldLabel>Camera clock position</FieldLabel>
          <div
            className="grid items-center gap-2 rounded-lg border p-2"
            style={{
              borderColor: "var(--atlas-border)",
              background: "var(--atlas-bg-muted)",
              gridTemplateColumns: "auto minmax(0, 1fr)",
            }}
          >
            <ClockDial value={clock} onChange={setClock} size={116} />
            <div className="min-w-0">
              <p
                className="text-sm font-bold"
                style={{ color: "var(--atlas-text-primary)" }}
              >
                {clock
                  ? `${clock} o'clock — ${clockPositionHints[clock]}`
                  : "No direction set"}
              </p>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--atlas-text-secondary)" }}
              >
                The door is 12 o&apos;clock. Tap a spot to record where the
                camera stood; tap again to clear.
              </p>
              <span
                className="mt-2 inline-block text-[10px] font-bold uppercase"
                style={{ color: "var(--atlas-text-tertiary)" }}
              >
                Optional
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="grid gap-2">
        <FieldLabel>Tags</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <TagChip
                key={tag}
                onRemove={() => setTags((prev) => prev.filter((item) => item !== tag))}
              >
                {tag}
              </TagChip>
            ))
          ) : (
            <span className="text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
              No tags yet.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <TagIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
              style={{ color: "var(--atlas-text-tertiary)" }}
            />
            <input
              className={cn(textInputBase, "pl-9")}
              style={textInputStyle}
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
              onFocus={focusAccent}
              onBlur={blurAccent}
              placeholder="Add a tag and press Enter"
            />
          </div>
          <button
            type="button"
            onClick={addTag}
            className="atlas-btn atlas-btn-outline h-11 shrink-0 px-3"
          >
            <PlusIcon />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function ImageMetadataScreen({ stateId }: MockupScreenProps) {
  const isGenerated = stateId === "generated";
  const asset = findAsset(isGenerated ? "asset-concept-terrazzo" : "asset-vanity-wall");

  const kind = asset.kind === "ai_generated" ? "ai_generated" : "site_visit";
  const OriginIcon = originIcons[asset.origin];
  const cdnUrl = `${CDN_ORIGIN}${asset.bunnyKey}`;

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ background: "var(--atlas-bg-root)", color: "var(--atlas-text-primary)" }}
    >
      <MockTopbar breadcrumb={["Files", "Hartley — Main Bathroom", "Image details"]} />

      <main className="atlas-frame py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="atlas-heading">
            <span className="atlas-eyebrow">Image metadata</span>
            <h1>{asset.label}</h1>
          </div>
          <div
            className="flex max-w-sm items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold"
            style={{
              borderColor: "var(--atlas-border)",
              background: "var(--atlas-bg-muted)",
              color: "var(--atlas-text-secondary)",
            }}
          >
            <TerminalIcon
              className="size-4 shrink-0"
              style={{ color: "var(--atlas-accent)" }}
            />
            The AI agent can edit these same fields alongside you.
          </div>
        </div>

        <div
          className="grid items-start gap-4"
          style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(340px, 0.92fr)" }}
        >
          {/* Left: preview + system facts */}
          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-body grid gap-4">
              <MockImage
                seed={asset.seed}
                ratio="4 / 3"
                className="w-full rounded-lg"
                icon={
                  isGenerated ? (
                    <SparklesIcon className="size-7" />
                  ) : (
                    <CameraIcon className="size-7" />
                  )
                }
              >
                <span className="absolute left-2.5 top-2.5">
                  <StatusPill tone={isGenerated ? "accent" : "blue"}>
                    {isGenerated ? (
                      <SparklesIcon className="size-3" />
                    ) : (
                      <CameraIcon className="size-3" />
                    )}
                    {fileImageKindLabels[kind]}
                  </StatusPill>
                </span>
              </MockImage>

              <div className="grid gap-2.5">
                <div className="flex items-center gap-2">
                  <OriginIcon
                    className="size-3.5 shrink-0"
                    style={{ color: "var(--atlas-text-tertiary)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
                    {originLabels[asset.origin]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon
                    className="size-3.5 shrink-0"
                    style={{ color: "var(--atlas-text-tertiary)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
                    {isGenerated ? "Created" : "Captured"} {asset.capturedAt}
                  </span>
                </div>
              </div>

              {/* System panel */}
              <div
                className="grid gap-3 rounded-lg border p-3"
                style={{
                  borderColor: "var(--atlas-border)",
                  background: "var(--atlas-bg-muted)",
                }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: "var(--atlas-text-tertiary)" }}
                >
                  System — read only
                </span>
                <CopyRow icon={LinkIcon} caption="Bunny key" value={asset.bunnyKey} />
                <CopyRow icon={LinkIcon} caption="CDN URL" value={cdnUrl} />
              </div>
            </div>
          </section>

          {/* Right: editable panel */}
          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-head">
              <div className="flex min-w-0 flex-col">
                <h2>Details</h2>
                <p className="mt-0.5 text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
                  Optional metadata — editable any time.
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                style={{
                  borderColor: "var(--atlas-border)",
                  background: "var(--atlas-bg-muted)",
                  color: "var(--atlas-text-secondary)",
                }}
                title="Every field here is also settable by the AI agent from the CLI"
              >
                <TerminalIcon className="size-3.5" style={{ color: "var(--atlas-accent)" }} />
                Agent parity
              </span>
            </div>
            <div className="atlas-simple-panel-body">
              <MetadataEditor key={stateId} asset={asset} isGenerated={isGenerated} />
            </div>
          </section>
        </div>
      </main>

      {/* Sticky, full-width bottom nav — back + save split half and half */}
      <div
        className="sticky bottom-0 z-30 border-t"
        style={{
          borderColor: "var(--atlas-border)",
          background: "color-mix(in srgb, var(--atlas-bg-surface) 92%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          className="atlas-frame grid items-center gap-3 py-3"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <button
            type="button"
            onClick={openSiteImagesFrame}
            className="atlas-btn atlas-btn-outline w-full"
            style={{ height: 48, fontSize: 14 }}
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </button>
          <button
            type="button"
            onClick={openSiteImagesFrame}
            className="atlas-btn atlas-btn-primary w-full"
            style={{ height: 48, fontSize: 14 }}
          >
            <CheckIcon className="size-4" />
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "image-metadata",
  title: "Image metadata editor",
  description:
    "Edit optional label, room, camera direction and tags for a stored asset, with read-only system facts and full CLI/agent field parity.",
  viewport: "desktop",
  states: [
    { id: "site-photo", label: "Site photo" },
    { id: "generated", label: "Generated image" },
  ],
  Component: ImageMetadataScreen,
};
