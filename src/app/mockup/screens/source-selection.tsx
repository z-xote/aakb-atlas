"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  ImageIcon,
  SparklesIcon,
  UploadCloudIcon,
  UploadIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MockupScreen } from "../types";
import { activeFile, mockAssets, type MockAsset } from "../mock-data";
import { MockImage, MockTopbar } from "../mock-ui";

type SourceTab = "camera" | "library" | "upload";

type Selection = {
  seed: string;
  label: string;
  origin: "camera" | "library" | "upload";
};

const tabs: Array<{ id: SourceTab; label: string; hint: string; icon: typeof CameraIcon }> = [
  { id: "camera", label: "Take Photo", hint: "Shoot a fresh before", icon: CameraIcon },
  { id: "library", label: "Use Library", hint: "Reuse a file image", icon: ImageIcon },
  { id: "upload", label: "Upload", hint: "Bring in a file", icon: UploadIcon },
];

const stageSteps = [
  { n: 1, label: "Source" },
  { n: 2, label: "Direction & references" },
  { n: 3, label: "Generate" },
];

const libraryAssets = mockAssets.filter((asset) => asset.fileId === activeFile.id);

function StageStrip() {
  const activeStep = 1;
  return (
    <div
      className="border-b"
      style={{
        borderColor: "var(--atlas-border)",
        background: "color-mix(in srgb, var(--atlas-bg-surface) 60%, transparent)",
      }}
    >
      <div className="atlas-frame flex items-center gap-2 py-2.5">
        {stageSteps.map((step, index) => {
          const active = step.n === activeStep;
          return (
            <div className="flex items-center gap-2" key={step.n}>
              <span
                className="grid size-5 place-items-center rounded-full text-[11px] font-bold"
                style={{
                  background: active ? "var(--atlas-accent)" : "var(--atlas-bg-muted)",
                  color: active ? "#ffffff" : "var(--atlas-text-tertiary)",
                }}
              >
                {step.n}
              </span>
              <span
                className="text-xs font-bold"
                style={{
                  color: active ? "var(--atlas-text-primary)" : "var(--atlas-text-tertiary)",
                }}
              >
                {step.label}
              </span>
              {index < stageSteps.length - 1 ? (
                <span
                  className="mx-1 hidden h-px w-8 sm:block"
                  style={{ background: "var(--atlas-border-strong)" }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LibraryCard({
  asset,
  selected,
  onSelect,
}: {
  asset: MockAsset;
  selected: boolean;
  onSelect: () => void;
}) {
  const isGenerated = asset.kind === "ai_generated";
  return (
    <button
      aria-pressed={selected}
      className="group relative overflow-hidden text-left transition-all"
      onClick={onSelect}
      style={{
        borderRadius: "var(--atlas-radius)",
        border: "1px solid",
        borderColor: selected ? "var(--atlas-accent)" : "var(--atlas-border)",
        background: "var(--atlas-bg-muted)",
        boxShadow: selected ? "0 0 0 2px var(--atlas-accent)" : "none",
      }}
      type="button"
    >
      <MockImage seed={asset.seed} ratio="4 / 3" />
      <span
        className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{
          background: isGenerated ? "var(--atlas-accent)" : "rgba(12, 10, 9, 0.62)",
          color: "#fafaf9",
        }}
      >
        {isGenerated ? <SparklesIcon className="size-3" /> : <CameraIcon className="size-3" />}
        {isGenerated ? "Generated" : "Site photo"}
      </span>
      {selected ? (
        <span
          className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full"
          style={{ background: "var(--atlas-accent)", color: "#ffffff" }}
        >
          <CheckIcon className="size-4" />
        </span>
      ) : null}
      <span className="flex items-center gap-2 px-3 py-2">
        <span
          className="min-w-0 flex-1 truncate text-sm font-bold"
          style={{ color: "var(--atlas-text-primary)" }}
        >
          {asset.label}
        </span>
        <span className="shrink-0 text-[11px] font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
          {asset.capturedAt}
        </span>
      </span>
    </button>
  );
}

function SourceSelectionScreen() {
  const [tab, setTab] = useState<SourceTab>("camera");
  const [selection, setSelection] = useState<Selection | null>(null);

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ background: "var(--atlas-bg-root)", color: "var(--atlas-text-primary)" }}
    >
      <MockTopbar breadcrumb={["Hartley — Main Bathroom", "Atlas Image"]} />
      <StageStrip />

      <section className="atlas-frame flex-1 py-6 pb-28">
        <div className="atlas-heading mb-5">
          <div className="atlas-eyebrow">Atlas Image · Step 1</div>
          <h1>Choose the before image</h1>
          <p className="atlas-subtle">
            Pick the source photo for this generation. You choose fresh every time — there is no
            pinned active photo.
          </p>
        </div>

        {/* Source tabs — 3-up */}
        <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {tabs.map((entry) => {
            const Icon = entry.icon;
            const active = tab === entry.id;
            return (
              <button
                aria-pressed={active}
                className={cn("atlas-image-tab", active && "atlas-active")}
                key={entry.id}
                onClick={() => setTab(entry.id)}
                type="button"
              >
                <Icon aria-hidden="true" />
                <span>
                  <strong>{entry.label}</strong>
                  <small>{entry.hint}</small>
                </span>
              </button>
            );
          })}
        </div>

        {/* Panels */}
        {tab === "camera" ? (
          <div className="atlas-simple-panel">
            <div className="atlas-simple-panel-head">
              <div>
                <h2>Take a fresh photo</h2>
                <p className="atlas-muted text-sm font-bold">
                  Opens the device camera and hands the shot straight to Atlas.
                </p>
              </div>
            </div>
            <div className="atlas-simple-panel-body">
              <div
                className="grid items-center gap-5"
                style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.9fr)" }}
              >
                <MockImage
                  seed="hartley-viewfinder"
                  ratio="16 / 10"
                  icon={<CameraIcon className="size-8" />}
                  className="rounded-lg"
                  style={{ borderRadius: "var(--atlas-radius)" }}
                >
                  <span
                    className="absolute inset-3 rounded-md border-2 border-dashed"
                    style={{ borderColor: "rgba(250, 250, 249, 0.5)" }}
                  />
                </MockImage>
                <div className="grid gap-3">
                  <button
                    className="atlas-btn atlas-btn-primary h-11 text-base"
                    onClick={() =>
                      setSelection({
                        seed: "hartley-fresh-shot",
                        label: "New photo",
                        origin: "camera",
                      })
                    }
                    type="button"
                  >
                    <CameraIcon aria-hidden="true" />
                    Open camera
                  </button>
                  <p className="atlas-subtle text-sm">Best on the site iPad or phone.</p>
                  <p
                    className="rounded-lg p-3 text-sm"
                    style={{ background: "var(--atlas-bg-muted)", color: "var(--atlas-text-secondary)" }}
                  >
                    The shot also lands in this file&apos;s images under Site visit, so you can reuse
                    it later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "library" ? (
          <div className="atlas-simple-panel">
            <div className="atlas-simple-panel-head">
              <div>
                <h2>Use a file image</h2>
                <p className="atlas-muted text-sm font-bold">
                  Site photos and past generations — outputs can be re-used as the next before.
                </p>
              </div>
            </div>
            <div className="atlas-simple-panel-body">
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                {libraryAssets.map((asset) => (
                  <LibraryCard
                    asset={asset}
                    key={asset.id}
                    onSelect={() =>
                      setSelection({ seed: asset.seed, label: asset.label, origin: "library" })
                    }
                    selected={selection?.origin === "library" && selection.seed === asset.seed}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "upload" ? (
          <div className="atlas-simple-panel">
            <div className="atlas-simple-panel-head">
              <div>
                <h2>Upload an image</h2>
                <p className="atlas-muted text-sm font-bold">
                  Add a photo from a computer or shared drive.
                </p>
              </div>
            </div>
            <div className="atlas-simple-panel-body grid gap-3">
              <button
                className="grid min-h-56 place-items-center gap-2 border-2 border-dashed p-6 text-center transition-colors"
                onClick={() =>
                  setSelection({
                    seed: "hartley-upload",
                    label: "Uploaded image",
                    origin: "upload",
                  })
                }
                style={{
                  borderColor:
                    selection?.origin === "upload"
                      ? "var(--atlas-accent)"
                      : "var(--atlas-border-strong)",
                  borderRadius: "var(--atlas-radius)",
                  background:
                    selection?.origin === "upload"
                      ? "var(--atlas-accent-soft)"
                      : "var(--atlas-bg-muted)",
                }}
                type="button"
              >
                <span
                  className="grid size-12 place-items-center rounded-full"
                  style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}
                >
                  {selection?.origin === "upload" ? (
                    <CheckIcon className="size-6" />
                  ) : (
                    <UploadCloudIcon className="size-6" />
                  )}
                </span>
                <strong className="text-base font-bold">
                  {selection?.origin === "upload" ? "Image ready" : "Drop an image or browse"}
                </strong>
                <span className="atlas-muted text-sm font-bold">
                  {selection?.origin === "upload"
                    ? "One image selected for this generation."
                    : "PNG or JPG, up to 25 MB."}
                </span>
              </button>
              <p
                className="rounded-lg p-3 text-sm"
                style={{ background: "var(--atlas-bg-muted)", color: "var(--atlas-text-secondary)" }}
              >
                Uploads go through Atlas to Bunny — nothing touches the device gallery.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* Persistent footer bar */}
      <div
        className="sticky bottom-0 z-10 border-t"
        style={{
          borderColor: "var(--atlas-border)",
          background: "color-mix(in srgb, var(--atlas-bg-surface) 94%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="atlas-frame flex items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {selection ? (
              <MockImage
                seed={selection.seed}
                ratio="1 / 1"
                className="size-11 shrink-0 rounded-md"
                style={{ borderRadius: "var(--atlas-radius)" }}
              />
            ) : (
              <span
                className="grid size-11 shrink-0 place-items-center rounded-md"
                style={{
                  background: "var(--atlas-bg-muted)",
                  color: "var(--atlas-text-tertiary)",
                  borderRadius: "var(--atlas-radius)",
                }}
              >
                <ImageIcon className="size-5" />
              </span>
            )}
            <div className="min-w-0">
              <div className="atlas-label">Selected source</div>
              <div className="truncate text-sm font-bold" style={{ color: "var(--atlas-text-primary)" }}>
                {selection ? selection.label : "No source selected yet"}
              </div>
            </div>
          </div>
          <button
            className="atlas-btn atlas-btn-primary h-11 px-5 text-base"
            disabled={!selection}
            style={selection ? undefined : { opacity: 0.5, cursor: "not-allowed" }}
            type="button"
          >
            Continue to direction
            <ArrowRightIcon aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "source-selection",
  title: "Atlas Image — choose source",
  description:
    "Stage 1 of the Atlas Image pipeline — pick the before image via Take Photo, Use Library, or Upload.",
  viewport: "desktop",
  Component: SourceSelectionScreen,
};
