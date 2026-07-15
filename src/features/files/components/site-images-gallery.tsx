"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  CameraIcon,
  ClockIcon,
  ImageIcon,
  MapPinIcon,
  SearchIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";

import type { FileAssetDto } from "@/features/files/data";
import type { FileImageKind } from "@/types/atlas";

type KindFilter = "all" | FileImageKind;
const NO_ROOM = "__none__";

const kindTabs: Array<{ id: KindFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "site_visit", label: "Site photos" },
  { id: "ai_generated", label: "Generated" },
];

function RoomChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      aria-pressed={active}
      className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-bold transition-colors"
      onClick={onClick}
      style={{
        borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)",
        background: active ? "var(--atlas-accent)" : "var(--atlas-bg-surface)",
        color: active ? "#ffffff" : "var(--atlas-text-secondary)",
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function MetaBadge({ icon: Icon, children }: { icon: typeof CameraIcon; children: ReactNode }) {
  return (
    <span
      className="inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-bold"
      style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)", color: "var(--atlas-text-secondary)" }}
    >
      <Icon className="size-3" />
      {children}
    </span>
  );
}

function ImageCard({ asset, fileId }: { asset: FileAssetDto; fileId: string }) {
  const generated = asset.kind === "ai_generated";
  const OriginIcon = asset.origin === "camera" ? CameraIcon : asset.origin === "generated" ? SparklesIcon : UploadIcon;
  const content = (
    <figure
      className="group flex h-full flex-col overflow-hidden border transition-all"
      style={{
        borderColor: generated ? "var(--atlas-accent)" : "var(--atlas-border)",
        borderRadius: "var(--atlas-radius)",
        background: "var(--atlas-bg-surface)",
      }}
    >
      <div className="relative aspect-4/3 overflow-hidden" style={{ background: "var(--atlas-bg-muted)" }}>
        {asset.url ? <Image alt={asset.label} className="object-cover" fill sizes="(max-width: 900px) 50vw, 25vw" src={asset.url} unoptimized /> : null}
        <span className="absolute left-1.5 top-1.5 grid size-7 place-items-center rounded-full" style={{ background: "rgba(12,10,9,.62)", color: "#fafaf9" }}>
          <OriginIcon className="size-3.5" />
        </span>
        {generated ? (
          <span className="absolute right-1.5 top-1.5 inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold" style={{ background: "var(--atlas-accent)", color: "#fff" }}>
            <SparklesIcon className="size-3" /> Generated
          </span>
        ) : null}
        {asset.status !== "ready" ? (
          <span className="absolute inset-x-2 bottom-2 rounded px-2 py-1 text-center text-xs font-bold" style={{ background: asset.status === "failed" ? "var(--destructive)" : "var(--atlas-amber)", color: "#fff" }}>
            {asset.status === "failed" ? "Upload failed — retry from capture" : "Uploading to Bunny…"}
          </span>
        ) : null}
      </div>
      <figcaption className="flex flex-1 flex-col gap-2 p-3">
        <span className="truncate text-sm font-bold" style={{ color: "var(--atlas-text-primary)" }}>{asset.label}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {asset.room ? <MetaBadge icon={MapPinIcon}>{asset.room}</MetaBadge> : null}
          {asset.cameraPositionClock ? <MetaBadge icon={ClockIcon}>{asset.cameraPositionClock} o&apos;clock</MetaBadge> : null}
          {!asset.room && !asset.cameraPositionClock ? <span className="text-[11px] font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>No room set</span> : null}
        </div>
      </figcaption>
    </figure>
  );

  return asset.status === "ready" ? <Link href={`/files/${fileId}/images/${asset.id}`}>{content}</Link> : content;
}

function EmptyGallery({ fileId }: { fileId: string }) {
  return (
    <div className="grid place-items-center gap-4 border border-dashed p-10 text-center" style={{ borderColor: "var(--atlas-border-strong)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-muted)" }}>
      <span className="grid size-16 place-items-center rounded-full" style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}><CameraIcon className="size-8" /></span>
      <div className="grid gap-1">
        <strong className="text-lg font-bold">No images yet — take the first before photo</strong>
        <span className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>Capture the room as it is today. Before photos become the starting point for every Atlas Image concept.</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link className="atlas-btn atlas-btn-primary h-10 px-5" href={`/files/${fileId}/images/capture`}><CameraIcon />Take photo</Link>
        <Link className="atlas-btn atlas-btn-outline h-10 px-5" href={`/files/${fileId}/images/capture?mode=upload`}><UploadIcon />Upload</Link>
      </div>
    </div>
  );
}

export function SiteImagesGallery({ assets, fileId }: { assets: FileAssetDto[]; fileId: string }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [room, setRoom] = useState("all");
  const [search, setSearch] = useState("");
  const rooms = useMemo(() => Array.from(new Set(assets.map((asset) => asset.room).filter((value): value is string => Boolean(value)))), [assets]);
  const hasNoRoom = assets.some((asset) => !asset.room);
  const counts = useMemo(() => ({
    all: assets.length,
    site_visit: assets.filter((asset) => asset.kind !== "ai_generated").length,
    ai_generated: assets.filter((asset) => asset.kind === "ai_generated").length,
  }), [assets]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (kind !== "all" && asset.kind !== kind) return false;
      if (room === NO_ROOM && asset.room) return false;
      if (room !== "all" && room !== NO_ROOM && asset.room !== room) return false;
      return !query || [asset.label, ...asset.tags].join(" ").toLowerCase().includes(query);
    });
  }, [assets, kind, room, search]);

  if (assets.length === 0) return <EmptyGallery fileId={fileId} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-lg border p-1" role="tablist" aria-label="Image kind" style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}>
          {kindTabs.map((tab) => {
            const active = kind === tab.id;
            return (
              <button aria-selected={active} className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-bold" key={tab.id} onClick={() => setKind(tab.id)} role="tab" type="button" style={{ background: active ? "var(--atlas-bg-surface)" : "transparent", color: active ? "var(--atlas-text-primary)" : "var(--atlas-text-secondary)", boxShadow: active ? "var(--atlas-shadow)" : undefined }}>
                {tab.label}<span className="rounded-full px-1.5 text-[11px]" style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}>{counts[tab.id]}</span>
              </button>
            );
          })}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-44 flex-1 sm:w-56">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: "var(--atlas-text-tertiary)" }} />
            <input aria-label="Search images by label or tag" className="h-9 w-full border pl-9 pr-3 text-sm outline-none" onChange={(event) => setSearch(event.target.value)} placeholder="Search labels or tags" style={{ borderColor: "var(--atlas-border)", borderRadius: "var(--atlas-radius)", background: "var(--atlas-bg-surface)" }} value={search} />
          </div>
          <Link className="atlas-btn atlas-btn-primary h-9 px-3" href={`/files/${fileId}/images/capture`}><CameraIcon />Add</Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RoomChip active={room === "all"} onClick={() => setRoom("all")}>All rooms</RoomChip>
        {rooms.map((name) => <RoomChip active={room === name} key={name} onClick={() => setRoom(name)}>{name}</RoomChip>)}
        {hasNoRoom ? <RoomChip active={room === NO_ROOM} onClick={() => setRoom(NO_ROOM)}>No room</RoomChip> : null}
      </div>
      {filtered.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{filtered.map((asset) => <ImageCard asset={asset} fileId={fileId} key={asset.id} />)}</div>
      ) : (
        <div className="grid place-items-center gap-1 border border-dashed p-8 text-center" style={{ borderColor: "var(--atlas-border-strong)", borderRadius: "var(--atlas-radius)" }}>
          <ImageIcon className="size-7" style={{ color: "var(--atlas-text-tertiary)" }} /><strong className="text-sm">No images match these filters</strong><span className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>Clear the search or pick a different room.</span>
        </div>
      )}
    </div>
  );
}
