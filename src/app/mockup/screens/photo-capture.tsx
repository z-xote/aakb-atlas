"use client";

import { useState } from "react";
import {
  CheckIcon,
  ImageIcon,
  PlusIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MockupScreen, MockupScreenProps } from "../types";
import {
  activeFile,
  clockPositionHints,
  roomChoices,
  type ClockPosition,
} from "../mock-data";
import { ClockDial, MockImage } from "../mock-ui";

/* ------------------------------------------------------------------ */
/* Camera — full-bleed dark-glass viewfinder                           */
/* ------------------------------------------------------------------ */

function CameraState() {
  return (
    <div
      className="relative flex min-h-full flex-1 flex-col overflow-hidden"
      style={{ background: "#0c0a09", color: "#fafaf9" }}
    >
      {/* Viewfinder fills the whole frame */}
      <MockImage
        seed="hartley-viewfinder"
        ratio="auto"
        className="absolute inset-0 size-full"
        style={{ aspectRatio: "auto" }}
      />

      {/* Edge vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 42%, transparent 46%, rgba(12,10,9,0.72) 100%)",
        }}
      />

      {/* Rule-of-thirds grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(250,250,249,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(250,250,249,0.16) 1px, transparent 1px)",
          backgroundSize: "33.333% 33.333%",
          backgroundPosition: "0 0",
        }}
      />

      {/* Top bar */}
      <div className="relative flex items-center justify-between gap-2 p-4">
        <span
          className="inline-flex h-9 max-w-[calc(100%-52px)] items-center gap-2 truncate rounded-full px-3 text-xs font-bold"
          style={{
            background: "rgba(12,10,9,0.55)",
            border: "1px solid rgba(250,250,249,0.18)",
            backdropFilter: "blur(10px)",
          }}
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: "#f87171" }}
          />
          <span className="truncate">{activeFile.title}</span>
        </span>
        <button
          aria-label="Close camera"
          className="grid size-11 shrink-0 place-items-center rounded-full"
          style={{
            background: "rgba(12,10,9,0.55)",
            border: "1px solid rgba(250,250,249,0.18)",
            backdropFilter: "blur(10px)",
            color: "#fafaf9",
          }}
          type="button"
        >
          <XIcon className="size-5" />
        </button>
      </div>

      <div className="flex-1" />

      {/* Bottom control bar */}
      <div
        className="relative flex items-center justify-between gap-3 px-6 pb-8 pt-5"
        style={{
          background:
            "linear-gradient(to top, rgba(12,10,9,0.78), transparent)",
        }}
      >
        {/* Upload instead */}
        <button
          className="grid h-14 w-14 place-items-center rounded-2xl text-[10px] font-bold"
          style={{
            background: "rgba(12,10,9,0.5)",
            border: "1px solid rgba(250,250,249,0.18)",
            backdropFilter: "blur(10px)",
            color: "#fafaf9",
          }}
          type="button"
        >
          <ImageIcon className="size-5" />
          <span className="mt-0.5">Upload</span>
        </button>

        {/* Shutter */}
        <button
          aria-label="Take photo"
          className="grid size-[76px] shrink-0 place-items-center rounded-full transition-transform active:scale-95"
          style={{ border: "4px solid rgba(250,250,249,0.9)" }}
          type="button"
        >
          <span
            className="size-[58px] rounded-full"
            style={{ background: "#fafaf9" }}
          />
        </button>

        {/* Last-shot thumbnail with count badge */}
        <button
          aria-label="Review captured shots"
          className="relative size-14 shrink-0 overflow-hidden rounded-2xl"
          style={{ border: "2px solid rgba(250,250,249,0.7)" }}
          type="button"
        >
          <MockImage
            seed="hartley-doorway"
            ratio="1 / 1"
            className="size-full"
          />
          <span
            className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full text-[11px] font-bold"
            style={{ background: "var(--atlas-accent)", color: "#ffffff" }}
          >
            4
          </span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review — the shot just taken + optional metadata                    */
/* ------------------------------------------------------------------ */

function ReviewState() {
  const [clock, setClock] = useState<ClockPosition | null>(null);
  const [room, setRoom] = useState<string | null>("Bathroom");
  const [customOpen, setCustomOpen] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [label, setLabel] = useState("");

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <div className="flex flex-1 flex-col gap-5 p-4 pb-2">
        {/* Fresh shot */}
        <div>
          <MockImage
            seed="hartley-fresh-shot"
            ratio="4 / 3"
            className="w-full"
            style={{ borderRadius: "var(--atlas-radius)" }}
          />
          <p className="atlas-muted mt-2 text-xs font-bold">
            Shot 5 · just now — add a few details or skip straight to saving.
          </p>
        </div>

        {/* 1. Camera position */}
        <section className="atlas-simple-panel">
          <div className="atlas-simple-panel-head">
            <h2 className="text-base!">Where was the camera?</h2>
            <span className="atlas-muted text-xs font-bold">Optional</span>
          </div>
          <div className="atlas-simple-panel-body flex flex-col items-center gap-2">
            <ClockDial value={clock} onChange={setClock} />
            <p
              className="text-sm font-bold"
              style={{
                color: clock
                  ? "var(--atlas-text-primary)"
                  : "var(--atlas-text-tertiary)",
              }}
            >
              {clock
                ? clockPositionHints[clock]
                : "Tap a spot — door is 12 o'clock"}
            </p>
            <p className="atlas-muted text-xs font-bold">
              Optional — skip if unsure
            </p>
          </div>
        </section>

        {/* 2. Room / area */}
        <section className="flex flex-col gap-2">
          <span className="atlas-label">Room / area</span>
          <div className="flex flex-wrap gap-2">
            {roomChoices.map((choice) => {
              const active = room === choice;
              return (
                <button
                  className={cn(
                    "inline-flex h-11 items-center rounded-full border px-4 text-sm font-bold transition-colors"
                  )}
                  key={choice}
                  onClick={() => {
                    setRoom(active ? null : choice);
                    setCustomOpen(false);
                  }}
                  style={{
                    borderColor: active
                      ? "var(--atlas-accent)"
                      : "var(--atlas-border)",
                    background: active
                      ? "var(--atlas-accent-soft)"
                      : "var(--atlas-bg-surface)",
                    color: active
                      ? "var(--atlas-accent)"
                      : "var(--atlas-text-secondary)",
                  }}
                  type="button"
                >
                  {choice}
                </button>
              );
            })}

            {customOpen ? (
              <input
                autoFocus
                className="h-11 min-w-0 flex-1 rounded-full border px-4 text-sm font-bold outline-none transition-colors"
                onChange={(event) => {
                  setCustomRoom(event.target.value);
                  setRoom(event.target.value || null);
                }}
                placeholder="Type a room…"
                style={{
                  borderColor: "var(--atlas-accent)",
                  background: "var(--atlas-bg-surface)",
                  color: "var(--atlas-text-primary)",
                }}
                type="text"
                value={customRoom}
              />
            ) : (
              <button
                className="inline-flex h-11 items-center gap-1 rounded-full border border-dashed px-4 text-sm font-bold transition-colors"
                onClick={() => {
                  setCustomOpen(true);
                  setRoom(customRoom || null);
                }}
                style={{
                  borderColor: "var(--atlas-border-strong)",
                  background: "var(--atlas-bg-surface)",
                  color: "var(--atlas-text-secondary)",
                }}
                type="button"
              >
                <PlusIcon className="size-4" />
                Custom…
              </button>
            )}
          </div>
        </section>

        {/* 3. Label */}
        <section className="flex flex-col gap-2">
          <span className="atlas-label">Label</span>
          <input
            className="h-11 w-full border px-3 text-sm font-bold outline-none transition-colors"
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Vanity wall"
            style={{
              borderColor: "var(--atlas-border-strong)",
              borderRadius: "var(--atlas-radius)",
              background: "var(--atlas-bg-surface)",
              color: "var(--atlas-text-primary)",
            }}
            type="text"
            value={label}
          />
        </section>
      </div>

      {/* Sticky-feel footer */}
      <div
        className="sticky bottom-0 flex flex-col gap-2 border-t px-4 pb-5 pt-3"
        style={{
          borderColor: "var(--atlas-border)",
          background:
            "color-mix(in srgb, var(--atlas-bg-surface) 92%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            className="atlas-btn atlas-btn-outline h-12!"
            type="button"
          >
            <RotateCcwIcon />
            Retake
          </button>
          <button
            className="atlas-btn atlas-btn-primary h-12!"
            type="button"
          >
            <CheckIcon />
            Save to file
          </button>
        </div>
        <p className="atlas-muted text-center text-xs font-bold">
          Saved to {activeFile.title} · uploads to Bunny in the background
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PhotoCaptureScreen({ stateId }: MockupScreenProps) {
  if (stateId === "review") {
    return <ReviewState />;
  }
  return <CameraState />;
}

export const screen: MockupScreen = {
  id: "photo-capture",
  title: "Photo capture & review",
  description:
    "iPad/phone-first capture that fills the file's image library before the pipeline — shoot, then add quick optional metadata.",
  viewport: "phone",
  states: [
    { id: "camera", label: "Camera" },
    { id: "review", label: "Review" },
  ],
  Component: PhotoCaptureScreen,
};
