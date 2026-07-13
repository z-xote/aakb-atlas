"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CameraIcon,
  ClockIcon,
  ImageIcon,
  MapPinIcon,
  PencilIcon,
  SearchIcon,
  SparklesIcon,
  UploadIcon,
  UserIcon,
  WorkflowIcon,
} from "lucide-react";

import { projectTypeLabels, workflowStageLabels } from "@/types/atlas";
import type { MockupScreen } from "../types";
import {
  activeFile,
  mockAssets,
  type MockAsset,
  type MockAssetOrigin,
} from "../mock-data";
import { MockImage, MockTopbar, StatusPill } from "../mock-ui";

/* ------------------------------------------------------------------ */
/* Vocabulary local to this screen                                     */
/* ------------------------------------------------------------------ */

type KindFilter = "all" | "site_visit" | "ai_generated";
const NO_ROOM = "__none__";

const kindTabs: Array<{ id: KindFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "site_visit", label: "Site photos" },
  { id: "ai_generated", label: "Generated" },
];

const originMeta: Record<
  MockAssetOrigin,
  { icon: typeof CameraIcon; label: string }
> = {
  camera: { icon: CameraIcon, label: "Captured on site" },
  upload: { icon: UploadIcon, label: "Uploaded" },
  generated: { icon: SparklesIcon, label: "Atlas Image" },
};

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function MetaBadge({
  icon: Icon,
  children,
  accent = false,
}: {
  icon: typeof CameraIcon;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className="inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-bold"
      style={{
        borderColor: accent ? "var(--atlas-accent-muted)" : "var(--atlas-border)",
        background: accent ? "var(--atlas-accent-soft)" : "var(--atlas-bg-muted)",
        color: accent ? "var(--atlas-accent)" : "var(--atlas-text-secondary)",
      }}
    >
      <Icon className="size-3" />
      {children}
    </span>
  );
}

function BannerField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CameraIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-lg"
        style={{ background: "var(--atlas-bg-muted)", color: "var(--atlas-accent)" }}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="atlas-label">{label}</span>
        <span
          className="block truncate text-sm font-bold"
          style={{ color: "var(--atlas-text-primary)" }}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

function ImageCard({ asset }: { asset: MockAsset }) {
  const isGenerated = asset.kind === "ai_generated";
  const origin = originMeta[asset.origin];
  const OriginIcon = origin.icon;

  return (
    <figure
      className="group flex flex-col overflow-hidden border transition-all"
      style={{
        borderColor: isGenerated ? "var(--atlas-accent)" : "var(--atlas-border)",
        borderRadius: "var(--atlas-radius)",
        background: "var(--atlas-bg-surface)",
        boxShadow: isGenerated
          ? "0 0 0 1px var(--atlas-accent-muted)"
          : undefined,
      }}
    >
      <div className="relative">
        <MockImage
          seed={asset.seed}
          ratio="4 / 3"
          icon={isGenerated ? <SparklesIcon className="size-6" /> : undefined}
        >
          {/* origin marker */}
          <span
            className="absolute left-1.5 top-1.5 grid size-7 place-items-center rounded-full"
            style={{ background: "rgba(12, 10, 9, 0.62)", color: "#fafaf9" }}
            title={origin.label}
          >
            <OriginIcon className="size-3.5" />
          </span>
          {isGenerated ? (
            <span
              className="absolute right-1.5 top-1.5 inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold"
              style={{ background: "var(--atlas-accent)", color: "#ffffff" }}
            >
              <SparklesIcon className="size-3" />
              Generated
            </span>
          ) : null}
        </MockImage>
      </div>

      <figcaption className="flex flex-1 flex-col gap-2 p-3">
        <span
          className="truncate text-sm font-bold"
          style={{ color: "var(--atlas-text-primary)" }}
        >
          {asset.label}
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {asset.room ? (
            <MetaBadge icon={MapPinIcon}>{asset.room}</MetaBadge>
          ) : null}
          {asset.clock ? (
            <MetaBadge icon={ClockIcon}>{asset.clock} o&apos;clock</MetaBadge>
          ) : null}
          {!asset.room && !asset.clock ? (
            <span
              className="text-[11px] font-bold"
              style={{ color: "var(--atlas-text-tertiary)" }}
            >
              No room set
            </span>
          ) : null}
        </div>

        {/* Always-visible action row so the affordance reads in a walkthrough */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            className="atlas-btn atlas-btn-primary h-8 flex-1"
            type="button"
            style={
              isGenerated
                ? undefined
                : {
                    background: "var(--atlas-accent-soft)",
                    borderColor: "var(--atlas-accent-muted)",
                    color: "var(--atlas-accent)",
                  }
            }
          >
            <SparklesIcon />
            Open in Atlas Image
          </button>
          <button
            aria-label="Edit details"
            className="atlas-icon-button atlas-icon-button-bordered"
            title="Edit details"
            type="button"
          >
            <PencilIcon />
          </button>
        </div>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function GalleryEmpty() {
  return (
    <div
      className="grid place-items-center gap-4 border border-dashed p-10 text-center"
      style={{
        borderColor: "var(--atlas-border-strong)",
        borderRadius: "var(--atlas-radius)",
        background:
          "linear-gradient(150deg, color-mix(in srgb, var(--atlas-accent-soft) 60%, transparent), transparent 62%), var(--atlas-bg-muted)",
        boxShadow: "var(--atlas-shadow)",
      }}
    >
      <span
        className="grid size-16 place-items-center rounded-full"
        style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}
      >
        <CameraIcon className="size-8" />
      </span>
      <div className="grid gap-1">
        <strong
          className="text-lg font-bold"
          style={{ color: "var(--atlas-text-primary)" }}
        >
          No images yet — take the first before photo
        </strong>
        <span className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
          Capture the room as it is today. Before photos become the starting point
          for every Atlas Image concept.
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button className="atlas-btn atlas-btn-primary h-10 px-5" type="button">
          <CameraIcon />
          Take photo
        </button>
        <button className="atlas-btn atlas-btn-outline h-10 px-5" type="button">
          <UploadIcon />
          Upload
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function FileDetailsScreen({ stateId }: { stateId: string }) {
  const isEmpty = stateId === "empty";

  const fileAssets = useMemo(
    () => mockAssets.filter((asset) => asset.fileId === activeFile.id),
    []
  );

  const rooms = useMemo(() => {
    const seen: string[] = [];
    for (const asset of fileAssets) {
      if (asset.room && !seen.includes(asset.room)) seen.push(asset.room);
    }
    return seen;
  }, [fileAssets]);

  const hasNoRoomAssets = fileAssets.some((asset) => !asset.room);

  const [kind, setKind] = useState<KindFilter>("all");
  const [room, setRoom] = useState<string>("all");
  const [search, setSearch] = useState("");

  const kindCounts = useMemo(
    () => ({
      all: fileAssets.length,
      site_visit: fileAssets.filter((a) => a.kind === "site_visit").length,
      ai_generated: fileAssets.filter((a) => a.kind === "ai_generated").length,
    }),
    [fileAssets]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return fileAssets.filter((asset) => {
      if (kind !== "all" && asset.kind !== kind) return false;
      if (room === NO_ROOM && asset.room) return false;
      if (room !== "all" && room !== NO_ROOM && asset.room !== room) return false;
      if (query) {
        const haystack = [asset.label, ...asset.tags].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [fileAssets, kind, room, search]);

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <MockTopbarWithCrumb />

      <section className="atlas-detail-view flex flex-col gap-4">
        {/* Compact file banner */}
        <article
          className="flex flex-wrap items-start justify-between gap-4 border p-4"
          style={{
            borderColor: "var(--atlas-border)",
            borderRadius: "var(--atlas-radius)",
            background: "var(--atlas-bg-surface)",
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="atlas-eyebrow">File</div>
            <h1 className="text-2xl font-bold tracking-normal">
              {activeFile.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill tone="blue">
                {projectTypeLabels[activeFile.projectType]}
              </StatusPill>
              <StatusPill tone="accent">
                {workflowStageLabels[activeFile.stage]}
              </StatusPill>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              <BannerField
                icon={UserIcon}
                label="Contact"
                value={activeFile.contactName}
              />
              <BannerField
                icon={MapPinIcon}
                label="Suburb"
                value={activeFile.suburb}
              />
              <BannerField
                icon={ClockIcon}
                label="Updated"
                value={activeFile.updatedAt}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button className="atlas-btn atlas-btn-outline h-10 px-4" type="button">
              <WorkflowIcon />
              Open Pipelines
            </button>
            <button className="atlas-btn atlas-btn-primary h-10 px-4" type="button">
              <CameraIcon />
              Add photo
            </button>
          </div>
        </article>

        {/* Gallery panel */}
        <section className="atlas-simple-panel">
          <div className="atlas-simple-panel-head">
            <div>
              <h2>File images</h2>
              <p className="atlas-muted">
                Before photos and Atlas Image concepts that live on this file.
              </p>
            </div>
            {!isEmpty ? (
              <StatusPill tone="muted">
                {filtered.length} of {fileAssets.length}
              </StatusPill>
            ) : null}
          </div>

          <div className="atlas-simple-panel-body">
            {isEmpty ? (
              <GalleryEmpty />
            ) : (
              <div className="flex flex-col gap-4">
                {/* Filter row: kind tabs + tag search */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="inline-flex items-center gap-1 rounded-lg border p-1"
                    role="tablist"
                    aria-label="Image kind"
                    style={{
                      borderColor: "var(--atlas-border)",
                      background: "var(--atlas-bg-muted)",
                    }}
                  >
                    {kindTabs.map((tab) => {
                      const active = kind === tab.id;
                      return (
                        <button
                          aria-selected={active}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-bold transition-colors"
                          key={tab.id}
                          onClick={() => setKind(tab.id)}
                          role="tab"
                          type="button"
                          style={{
                            background: active
                              ? "var(--atlas-bg-surface)"
                              : "transparent",
                            color: active
                              ? "var(--atlas-text-primary)"
                              : "var(--atlas-text-secondary)",
                            boxShadow: active ? "var(--atlas-shadow)" : undefined,
                          }}
                        >
                          {tab.label}
                          <span
                            className="rounded-full px-1.5 text-[11px]"
                            style={{
                              background: active
                                ? "var(--atlas-accent-soft)"
                                : "var(--atlas-bg-hover)",
                              color: active
                                ? "var(--atlas-accent)"
                                : "var(--atlas-text-tertiary)",
                            }}
                          >
                            {kindCounts[tab.id]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full max-w-56 sm:w-56">
                    <SearchIcon
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                      style={{ color: "var(--atlas-text-tertiary)" }}
                    />
                    <input
                      aria-label="Search images by tag"
                      className="h-9 w-full border pl-9 pr-3 text-sm outline-none transition-colors"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search tags"
                      style={{
                        borderColor: "var(--atlas-border)",
                        borderRadius: "var(--atlas-radius)",
                        background: "var(--atlas-bg-surface)",
                        color: "var(--atlas-text-primary)",
                      }}
                      value={search}
                    />
                  </div>
                </div>

                {/* Room filter chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <RoomChip
                    active={room === "all"}
                    onClick={() => setRoom("all")}
                  >
                    All rooms
                  </RoomChip>
                  {rooms.map((name) => (
                    <RoomChip
                      active={room === name}
                      key={name}
                      onClick={() => setRoom(name)}
                    >
                      {name}
                    </RoomChip>
                  ))}
                  {hasNoRoomAssets ? (
                    <RoomChip
                      active={room === NO_ROOM}
                      onClick={() => setRoom(NO_ROOM)}
                    >
                      No room
                    </RoomChip>
                  ) : null}
                </div>

                {/* Grid */}
                {filtered.length > 0 ? (
                  <div className="atlas-image-grid">
                    {filtered.map((asset) => (
                      <ImageCard asset={asset} key={asset.id} />
                    ))}
                  </div>
                ) : (
                  <div
                    className="grid place-items-center gap-1 border border-dashed p-8 text-center"
                    style={{
                      borderColor: "var(--atlas-border-strong)",
                      borderRadius: "var(--atlas-radius)",
                      color: "var(--atlas-text-secondary)",
                    }}
                  >
                    <ImageIcon
                      className="size-7"
                      style={{ color: "var(--atlas-text-tertiary)" }}
                    />
                    <strong
                      className="text-sm font-bold"
                      style={{ color: "var(--atlas-text-primary)" }}
                    >
                      No images match these filters
                    </strong>
                    <span className="text-sm">
                      Clear the tag search or pick a different room.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

function RoomChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-pressed={active}
      className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-bold transition-colors"
      onClick={onClick}
      type="button"
      style={{
        borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)",
        background: active ? "var(--atlas-accent)" : "var(--atlas-bg-surface)",
        color: active ? "#ffffff" : "var(--atlas-text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function MockTopbarWithCrumb() {
  return <MockTopbar breadcrumb={["Files", activeFile.title]} />;
}

export const screen: MockupScreen = {
  id: "file-details",
  title: "File details & gallery",
  description:
    "The v0.2 file page — compact banner over a capture-first image gallery with kind tabs, room chips, and per-card Atlas Image handoff.",
  viewport: "desktop",
  states: [
    { id: "populated", label: "Populated" },
    { id: "empty", label: "No images" },
  ],
  Component: FileDetailsScreen,
};
