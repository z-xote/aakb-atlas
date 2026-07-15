"use client";

import type { CSSProperties, ReactNode } from "react";
import { ArrowLeftIcon, ImageIcon, LogOutIcon } from "lucide-react";

import { ThemeMenu } from "@/features/files/components/theme-menu";
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
/* MockTopbar — visual-only copy of the production AtlasTopbar chrome   */
/* ------------------------------------------------------------------ */

export type MockTopbarProps = {
  /** Breadcrumb trail, e.g. ["Files", "Hartley — Main Bathroom"]. The last
   *  entry is the current page; earlier entries render as muted links. When
   *  omitted, the topbar sits at the root ("Files", no back button). */
  breadcrumb?: string[];
  /** Wires the back arrow to real navigation (e.g. leaving a sub-page). When
   *  omitted the back button stays visual-only, as in most prototype frames. */
  onBack?: () => void;
  /** Right-aligned slot for screen-specific actions, before theme + sign out. */
  actions?: ReactNode;
};

/**
 * Mirror of the app's {@link AtlasTopbar}: a back button + "Files / …"
 * breadcrumb on the left, theme toggle and sign-out on the right. Back and
 * sign-out are visual-only here so the click-through prototype never navigates
 * away or ends its session.
 */
export function MockTopbar({ breadcrumb, onBack, actions }: MockTopbarProps) {
  const trail = breadcrumb && breadcrumb.length > 0 ? breadcrumb : ["Files"];
  const isRoot = !breadcrumb || breadcrumb.length === 0;

  return (
    <header className="atlas-topbar">
      {isRoot ? null : (
        <button
          className="atlas-icon-button"
          type="button"
          aria-label="Back"
          onClick={onBack}
        >
          <ArrowLeftIcon />
        </button>
      )}

      <nav className="atlas-breadcrumb" aria-label="Breadcrumb">
        {trail.map((part, index) => {
          const isLast = index === trail.length - 1;
          return (
            <span className="flex min-w-0 items-center gap-2" key={part}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              <span className={cn(isLast ? "atlas-current" : "whitespace-nowrap")}>
                {part}
              </span>
            </span>
          );
        })}
      </nav>

      <div className="atlas-topbar-spacer" />
      <div className="atlas-topbar-actions">
        {actions}
        <ThemeMenu />
        <button className="atlas-signout-button" type="button">
          <LogOutIcon />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* MockBottomNav — sticky, full-bleed progression bar                  */
/* ------------------------------------------------------------------ */

/**
 * Full-width sticky bottom nav shared across the Atlas Image pipeline
 * screens. It hosts exactly two big, half-width actions — a back/secondary
 * choice on the left and the forward/primary choice on the right — so the
 * flow is thumb-friendly on the site iPad. Pass two elements as children;
 * give each `w-full` so it fills its half.
 */
export function MockBottomNav({ children }: { children: ReactNode }) {
  return (
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
        {children}
      </div>
    </div>
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
  // Edge midpoints hold the true clock spots; the four corners take 2/4/8/10.
  { position: "12", style: { top: 0, left: "50%", transform: "translate(-50%, -50%)" } },
  { position: "2", style: { top: 0, right: 0, transform: "translate(50%, -50%)" } },
  { position: "3", style: { top: "50%", right: 0, transform: "translate(50%, -50%)" } },
  { position: "4", style: { bottom: 0, right: 0, transform: "translate(50%, 50%)" } },
  { position: "6", style: { bottom: 0, left: "50%", transform: "translate(-50%, 50%)" } },
  { position: "8", style: { bottom: 0, left: 0, transform: "translate(-50%, 50%)" } },
  { position: "9", style: { top: "50%", left: 0, transform: "translate(-50%, -50%)" } },
  { position: "10", style: { top: 0, left: 0, transform: "translate(-50%, -50%)" } },
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
      // Extra top margin reserves room for the "Door" caption, which floats
      // above the dial clear of the 12 o'clock spot.
      style={{ width: size, height: size, margin: "46px 14px 14px" }}
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
          // Lift the caption above the 12 o'clock button (which straddles the
          // dial's top edge) so the two no longer overlap.
          marginTop: -32,
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
