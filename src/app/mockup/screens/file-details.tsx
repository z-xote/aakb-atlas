"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  CameraIcon,
  ClockIcon,
  ImageIcon,
  MapPinIcon,
  SearchIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";

import { budgetRangeLabels, projectTypeLabels } from "@/types/atlas";
import {
  AtlasInfoField,
  workflowReadyLabel,
} from "@/features/files/components/atlas-primitives";
import type { MockupScreen } from "../types";
import {
  activeFile,
  mockAssets,
  type MockAsset,
  type MockAssetOrigin,
} from "../mock-data";
import { MockBottomNav, MockImage, MockTopbar, StatusPill } from "../mock-ui";

/* ------------------------------------------------------------------ */
/* Which of the file's two content views is on screen. The bottom nav  */
/* toggles between them; Pipelines is the constant second half.        */
/* ------------------------------------------------------------------ */

type FileView = "details" | "images";

/** Half-and-half nav toggle: purple outline, not a solid accent fill. */
const purpleOutlineNav: CSSProperties = {
  height: 48,
  borderColor: "var(--atlas-accent)",
  background: "var(--atlas-bg-surface)",
  color: "var(--atlas-accent)",
};

/** Jump the whole mockup to the Pipelines frame. */
function openPipelinesFrame() {
  window.location.hash = "pipelines";
}

/** Jump to the image details frame (frame 9). */
function openImageDetailsFrame() {
  window.location.hash = "image-metadata";
}

/**
 * Initial gallery view. Arriving via "#file-details/images" (e.g. Back from the
 * image editor) opens straight to Site images; otherwise start on File details.
 */
function initialFileView(): FileView {
  if (typeof window === "undefined") return "details";
  return window.location.hash.split("/")[1] === "images" ? "images" : "details";
}

/* ------------------------------------------------------------------ */
/* Mock details that aren't on the shared file record                  */
/* ------------------------------------------------------------------ */

const contactEmail = "hartley.home@gmail.com";
const contactPhone = "0412 987 654";
const budgetLabel = budgetRangeLabels["20k_35k"];
const statusLabel = "Lead";

const fileNotes: Array<{ body: string; date: string }> = [
  {
    body: "Priya prefers warm oak over white oak — showed her the terrazzo + oak concept and she loved it.",
    date: "Today, 9:38 am",
  },
  {
    body: "Site visit done. Existing vanity is 1500mm; a wall-hung unit will need a new plumbing rough-in.",
    date: "28 Jun 2026",
  },
];

/* ------------------------------------------------------------------ */
/* Vocabulary local to the Site images gallery                         */
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

function ImageCard({ asset }: { asset: MockAsset }) {
  const isGenerated = asset.kind === "ai_generated";
  const origin = originMeta[asset.origin];
  const OriginIcon = origin.icon;

  return (
    <figure
      className="group flex cursor-pointer flex-col overflow-hidden border transition-all"
      onDoubleClick={openImageDetailsFrame}
      title="Double-click to open image details"
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
      </figcaption>
    </figure>
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

/* ------------------------------------------------------------------ */
/* Empty state for the gallery                                         */
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
/* View 1 — File details (mirrors the production file page)            */
/* ------------------------------------------------------------------ */

function FileDetailsView() {
  return (
    <section className="atlas-detail-view flex flex-col">
      {/* File card */}
      <article className="atlas-file-banner">
        <div>
          <div className="atlas-eyebrow">File</div>
          <h1>{activeFile.title}</h1>
          <p className="atlas-subtle">
            A file stores the people, status, project basics, budget range,
            images, and notes for one opportunity.
          </p>
          <div className="atlas-info-grid">
            <AtlasInfoField label="Status" value={statusLabel} />
            <AtlasInfoField label="Lead date" value={activeFile.createdAt} />
            <AtlasInfoField
              label="Project type"
              value={projectTypeLabels[activeFile.projectType]}
            />
            <AtlasInfoField label="Budget" value={budgetLabel} />
          </div>
        </div>
        <div className="atlas-ready-orb">
          {workflowReadyLabel(activeFile.stage)}
        </div>
      </article>

      {/* People + Project cards */}
      <div className="atlas-file-sections">
        <section className="atlas-simple-panel">
          <div className="atlas-simple-panel-head">
            <div>
              <h2>People</h2>
              <p className="atlas-muted">
                Basic contact details attached to the file.
              </p>
            </div>
            <button className="atlas-btn atlas-btn-outline" type="button">
              Edit
            </button>
          </div>
          <div className="atlas-simple-panel-body">
            <div className="atlas-info-stack">
              <AtlasInfoField label="Name" value={activeFile.contactName} />
              <AtlasInfoField label="Email" value={contactEmail} />
              <AtlasInfoField label="Phone" value={contactPhone} />
            </div>
          </div>
        </section>

        <section className="atlas-simple-panel">
          <div className="atlas-simple-panel-head">
            <div>
              <h2>Project</h2>
              <p className="atlas-muted">The simple file details we know so far.</p>
            </div>
          </div>
          <div className="atlas-simple-panel-body">
            <div className="atlas-info-stack">
              <AtlasInfoField
                label="Project type"
                value={projectTypeLabels[activeFile.projectType]}
              />
              <AtlasInfoField label="Budget range" value={budgetLabel} />
              <AtlasInfoField label="Lead date" value={activeFile.createdAt} />
            </div>
          </div>
        </section>
      </div>

      {/* File notes card */}
      <section className="atlas-simple-panel mt-4">
        <div className="atlas-simple-panel-head">
          <div>
            <h2>File notes</h2>
            <p className="atlas-muted">No CRM machinery, just the useful context.</p>
          </div>
        </div>
        <div className="atlas-simple-panel-body">
          <form className="atlas-note-form">
            <label htmlFor="file-note">Add a note</label>
            <textarea
              id="file-note"
              name="body"
              placeholder="Site visit detail, client preference, next action."
            />
            <button className="atlas-btn atlas-btn-primary" type="button">
              Add note
            </button>
          </form>

          <div className="atlas-note-list">
            {fileNotes.map((note) => (
              <div className="atlas-note-line" key={note.body}>
                <span>{note.body}</span>
                <small>{note.date}</small>
              </div>
            ))}
            <div className="atlas-note-line">
              <span>
                Use the Pipelines page when you want to generate images, create
                documents, or run other file actions.
              </span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* View 2 — Site images (the capture-first gallery)                    */
/* ------------------------------------------------------------------ */

function SiteImagesView({ isEmpty }: { isEmpty: boolean }) {
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
    <section className="atlas-detail-view flex flex-col gap-4">
      <div className="atlas-heading">
        <div className="atlas-eyebrow">File · Site images</div>
        <h1>{activeFile.title}</h1>
        <p className="atlas-subtle">
          Before photos and Atlas Image concepts that live on this file.
        </p>
      </div>

      <section className="atlas-simple-panel">
        <div className="atlas-simple-panel-head">
          <div>
            <h2>Site images</h2>
            <p className="atlas-muted">
              Keep site visit photos and generated concepts together in one place.
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
                <RoomChip active={room === "all"} onClick={() => setRoom("all")}>
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
                <div
                  className="atlas-image-grid"
                  style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
                >
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
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

function FileDetailsScreen({ stateId }: { stateId: string }) {
  const isEmpty = stateId === "empty";
  const [view, setView] = useState<FileView>(initialFileView);

  const breadcrumb =
    view === "details"
      ? ["Files", activeFile.title]
      : ["Files", activeFile.title, "Site images"];

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <MockTopbar breadcrumb={breadcrumb} />

      {view === "details" ? (
        <FileDetailsView />
      ) : (
        <SiteImagesView isEmpty={isEmpty} />
      )}

      {/*
        Half-and-half file nav. The right half is always Pipelines; the left
        half toggles to whichever of the two file views you're not on, so the
        loop is File details ⇄ Site images, plus Pipelines from either.
      */}
      <MockBottomNav>
        {view === "details" ? (
          <button
            className="atlas-bottom-nav-item w-full"
            onClick={() => setView("images")}
            style={purpleOutlineNav}
            type="button"
          >
            Site Images
          </button>
        ) : (
          <button
            className="atlas-bottom-nav-item w-full"
            onClick={() => setView("details")}
            style={purpleOutlineNav}
            type="button"
          >
            File Details
          </button>
        )}
        <button
          className="atlas-bottom-nav-item w-full"
          onClick={openPipelinesFrame}
          style={{ height: 48 }}
          type="button"
        >
          Pipelines
        </button>
      </MockBottomNav>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "file-details",
  title: "File details & site images",
  description:
    "The v0.2 file page — production-style file / people / project / notes cards, with a half-and-half bottom nav that toggles to the capture-first Site images gallery, plus Pipelines.",
  viewport: "desktop",
  states: [
    { id: "populated", label: "Populated" },
    { id: "empty", label: "No images" },
  ],
  Component: FileDetailsScreen,
};
