"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { clockPositionHints, type ClockPosition } from "@/types/atlas";

const dialSpots: Array<{ position: ClockPosition; style: CSSProperties }> = [
  { position: "12", style: { top: 0, left: "50%", transform: "translate(-50%, -50%)" } },
  { position: "2", style: { top: 0, right: 0, transform: "translate(50%, -50%)" } },
  { position: "3", style: { top: "50%", right: 0, transform: "translate(50%, -50%)" } },
  { position: "4", style: { bottom: 0, right: 0, transform: "translate(50%, 50%)" } },
  { position: "6", style: { bottom: 0, left: "50%", transform: "translate(-50%, 50%)" } },
  { position: "8", style: { bottom: 0, left: 0, transform: "translate(-50%, 50%)" } },
  { position: "9", style: { top: "50%", left: 0, transform: "translate(-50%, -50%)" } },
  { position: "10", style: { top: 0, left: 0, transform: "translate(-50%, -50%)" } },
];

export function ClockDial({
  value,
  onChange,
  size = 132,
}: {
  value: ClockPosition | null;
  onChange: (value: ClockPosition | null) => void;
  size?: number;
}) {
  return (
    <div className="relative" style={{ width: size, height: size, margin: "46px 14px 14px" }}>
      <div
        className="absolute inset-0 rounded-lg border-2 border-dashed"
        style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}
      />
      <span
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded border px-1.5 text-[10px] font-bold uppercase"
        style={{
          marginTop: -32,
          borderColor: "var(--atlas-border)",
          background: "var(--atlas-bg-surface)",
          color: "var(--atlas-text-tertiary)",
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
            key={position}
            onClick={() => onChange(active ? null : position)}
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
      className={cn("inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs font-bold", className)}
      style={{
        borderColor: "var(--atlas-border)",
        background: "var(--atlas-bg-muted)",
        color: "var(--atlas-text-secondary)",
      }}
    >
      {children}
      {onRemove ? (
        <button aria-label="Remove tag" className="-mr-1 grid size-4 place-items-center rounded-full" onClick={onRemove} type="button">
          ×
        </button>
      ) : null}
    </span>
  );
}
