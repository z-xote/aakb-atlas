"use client";

import type { CSSProperties, ReactNode } from "react";
import { ChevronRightIcon, FolderKanbanIcon, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { clockPositionHints, type ClockPosition } from "./mock-data";

/* ------------------------------------------------------------------ */
/* MockImage — deterministic placeholder "photo"                       */
/* ------------------------------------------------------------------ */

type Palette = {
  from: string;
  to: string;
  glow: string;
  ink: string;
};

const palettes: Palette[] = [
  { from: "#d8c9b4", to: "#8a7360", glow: "#f2e7d8", ink: "#5b4a3a" }, // oak
  { from: "#ccd6d1", to: "#68807a", glow: "#e8efec", ink: "#43574f" }, // sage
  { from: "#d9d3ca", to: "#8d867c", glow: "#f0ece5", ink: "#59544c" }, // stone
  { from: "#cfd6de", to: "#6e7f94", glow: "#e9edf3", ink: "#485668" }, // slate
  { from: "#e0cfc4", to: "#a17a63", glow: "#f4e9e2", ink: "#6b4f3e" }, // clay
  { from: "#e3ddd4", to: "#a9a094", glow: "#f6f2ec", ink: "#6d6558" }, // marble
  { from: "#d5cfdd", to: "#7d7394", glow: "#edeaf3", ink: "#544a68" }, // dusk
  { from: "#dcd6c2", to: "#96906f", glow: "#f2efe2", ink: "#615c44" }, // reed
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export type MockImageProps = {
  /** Any stable string. The same seed renders the same placeholder everywhere. */
  seed: string;
  /** Optional caption chip drawn in the bottom-left corner. */
  label?: string;
  /** CSS aspect-ratio, e.g. "4 / 3", "1 / 1", "16 / 10". Ignored if the parent sizes it. */
  ratio?: string;
  icon?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * Stand-in for a real photo. Layered gradients seeded from `seed`, so the
 * same asset looks identical across screens without any network fetch.
 */
export function MockImage({
  seed,
  label,
  ratio = "4 / 3",
  icon,
  className,
  style,
  children,
}: MockImageProps) {
  const hash = hashSeed(seed);
  const palette = palettes[hash % palettes.length];
  const angle = 115 + (hash % 90);
  const spotX = 18 + (hash % 55);
  const spotY = 14 + ((hash >> 3) % 40);

  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden", className)}
      style={{
        aspectRatio: ratio,
        background: [
          `radial-gradient(circle at ${spotX}% ${spotY}%, ${palette.glow}cc, transparent 52%)`,
          `linear-gradient(${angle}deg, ${palette.from}, ${palette.to})`,
        ].join(", "),
        ...style,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(${angle - 32}deg, transparent 0 26px, ${palette.ink}14 26px 27px)`,
        }}
      />
      <span
        className="absolute inset-0 grid place-items-center"
        style={{ color: `${palette.ink}66` }}
      >
        {icon ?? <ImageIcon className="size-6" />}
      </span>
      {label ? (
        <span
          className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded px-1.5 py-0.5 text-[11px] font-bold"
          style={{ background: "rgba(12, 10, 9, 0.62)", color: "#fafaf9" }}
        >
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MockTopbar — visual-only copy of the app chrome                     */
/* ------------------------------------------------------------------ */

export type MockTopbarProps = {
  /** Trail shown after the brand, e.g. ["Files", "Hartley — Main Bathroom"]. */
  breadcrumb?: string[];
  /** Right-aligned slot for screen-specific actions. */
  actions?: ReactNode;
  subtitle?: string;
};

export function MockTopbar({ breadcrumb, actions, subtitle = "All About Kitchens & Bathrooms" }: MockTopbarProps) {
  return (
    <header className="atlas-topbar">
      <div className="atlas-brand">
        <span className="atlas-brand-mark">
          <FolderKanbanIcon className="size-4" />
        </span>
        <span className="atlas-brand-copy">
          <strong>Atlas</strong>
          <span>{subtitle}</span>
        </span>
      </div>
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav className="atlas-breadcrumb ml-4 hidden sm:flex">
          {breadcrumb.map((part, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <span className="flex min-w-0 items-center gap-2" key={part}>
                {index > 0 ? <ChevronRightIcon className="size-3.5 shrink-0" /> : null}
                <span className={cn(isLast && "atlas-current")}>{part}</span>
              </span>
            );
          })}
        </nav>
      ) : null}
      <div className="atlas-topbar-spacer" />
      {actions ? <div className="atlas-topbar-actions">{actions}</div> : null}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* StatusPill                                                          */
/* ------------------------------------------------------------------ */

export type PillTone = "accent" | "green" | "blue" | "amber" | "muted" | "destructive";

const pillToneClass: Record<Exclude<PillTone, "destructive">, string> = {
  accent: "atlas-pill-accent",
  green: "atlas-pill-green",
  blue: "atlas-pill-blue",
  amber: "atlas-pill-amber",
  muted: "atlas-pill-muted",
};

export function StatusPill({
  tone = "muted",
  className,
  children,
}: {
  tone?: PillTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "atlas-pill inline-flex items-center gap-1",
        tone !== "destructive" && pillToneClass[tone],
        className
      )}
      style={
        tone === "destructive"
          ? {
              background: "color-mix(in srgb, var(--destructive) 14%, transparent)",
              color: "var(--destructive)",
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ClockDial — camera position relative to the door                    */
/* ------------------------------------------------------------------ */

export type ClockDialProps = {
  value?: ClockPosition | null;
  onChange?: (value: ClockPosition | null) => void;
  /** Pixel size of the square dial. */
  size?: number;
  readOnly?: boolean;
  className?: string;
};

const dialSpots: Array<{ position: ClockPosition; style: CSSProperties }> = [
  { position: "12", style: { top: 0, left: "50%", transform: "translate(-50%, -50%)" } },
  { position: "3", style: { top: "50%", right: 0, transform: "translate(50%, -50%)" } },
  { position: "6", style: { bottom: 0, left: "50%", transform: "translate(-50%, 50%)" } },
  { position: "9", style: { top: "50%", left: 0, transform: "translate(-50%, -50%)" } },
];

/**
 * The door is the 12 o'clock anchor. Tapping the active position again
 * clears it (direction metadata stays optional).
 */
export function ClockDial({
  value,
  onChange,
  size = 132,
  readOnly = false,
  className,
}: ClockDialProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size, margin: "14px" }}
    >
      <div
        className="absolute inset-0 rounded-lg border-2 border-dashed"
        style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}
      />
      <span
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded px-1.5 text-[10px] font-bold uppercase"
        style={{
          background: "var(--atlas-bg-surface)",
          color: "var(--atlas-text-tertiary)",
          border: "1px solid var(--atlas-border)",
          marginTop: -14,
        }}
      >
        Door
      </span>
      {dialSpots.map(({ position, style }) => {
        const active = value === position;
        return (
          <button
            aria-label={`Camera at ${position} o'clock — ${clockPositionHints[position]}`}
            aria-pressed={active}
            className="absolute grid size-9 place-items-center rounded-full border text-xs font-bold transition-colors"
            disabled={readOnly}
            key={position}
            onClick={() => onChange?.(active ? null : position)}
            style={{
              ...style,
              borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border-strong)",
              background: active ? "var(--atlas-accent)" : "var(--atlas-bg-surface)",
              color: active ? "#ffffff" : "var(--atlas-text-secondary)",
            }}
            type="button"
          >
            {position}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TagChip — small tag token used across metadata and catalog screens  */
/* ------------------------------------------------------------------ */

export function TagChip({
  children,
  onRemove,
  className,
}: {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs font-bold",
        className
      )}
      style={{
        borderColor: "var(--atlas-border)",
        background: "var(--atlas-bg-muted)",
        color: "var(--atlas-text-secondary)",
      }}
    >
      {children}
      {onRemove ? (
        <button
          aria-label="Remove tag"
          className="-mr-1 grid size-4 place-items-center rounded-full transition-colors hover:bg-[var(--atlas-bg-hover)]"
          onClick={onRemove}
          type="button"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
