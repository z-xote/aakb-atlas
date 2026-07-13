"use client";

import { useState } from "react";
import {
  DeleteIcon,
  FolderKanbanIcon,
  ShieldCheckIcon,
  TimerIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MockupScreen, MockupScreenProps } from "../types";
import { mockDevice } from "../mock-data";

const PIN_LENGTH = 4;

const keypad: Array<{ value: string; label?: string } | null> = [
  { value: "1" },
  { value: "2" },
  { value: "3" },
  { value: "4" },
  { value: "5" },
  { value: "6" },
  { value: "7" },
  { value: "8" },
  { value: "9" },
  null,
  { value: "0" },
  { value: "back" },
];

function Component({ stateId }: MockupScreenProps) {
  const wrongPin = stateId === "wrong-pin";
  const rateLimited = stateId === "rate-limited";

  // In the wrong-pin state, show a full row of (rejected) dots for context.
  const [pin, setPin] = useState<string>(wrongPin ? "1234" : "");

  const press = (value: string) => {
    if (rateLimited) return;
    if (value === "back") {
      setPin((current) => current.slice(0, -1));
      return;
    }
    setPin((current) =>
      current.length >= PIN_LENGTH ? current : current + value
    );
  };

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-7 px-6 py-10">
        {/* Atlas mark + device */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className="grid size-12 place-items-center text-lg font-bold"
            style={{
              borderRadius: "var(--atlas-radius)",
              background: "var(--atlas-accent-soft)",
              color: "var(--atlas-accent)",
            }}
          >
            <FolderKanbanIcon className="size-6" />
          </span>
          <div className="flex flex-col gap-1">
            <span
              className="text-[11px] font-bold uppercase tracking-normal"
              style={{ color: "var(--atlas-text-tertiary)" }}
            >
              {mockDevice.name}
            </span>
            <h1 className="text-xl font-bold tracking-normal">Enter your PIN</h1>
          </div>
        </div>

        {/* PIN dots */}
        <div className="flex items-center gap-4" aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const filled = index < pin.length;
            const tone = wrongPin
              ? "var(--destructive)"
              : "var(--atlas-accent)";
            return (
              <span
                key={index}
                className="size-3.5 rounded-full border-2 transition-colors"
                style={{
                  borderColor: filled ? tone : "var(--atlas-border-strong)",
                  background: filled ? tone : "transparent",
                }}
              />
            );
          })}
        </div>

        {/* Status line */}
        <div className="flex min-h-6 items-center justify-center px-2 text-center">
          {wrongPin ? (
            <p
              className="text-sm font-bold"
              style={{ color: "var(--destructive)" }}
            >
              That PIN didn&apos;t match — 3 attempts left
            </p>
          ) : rateLimited ? null : (
            <p className="text-sm" style={{ color: "var(--atlas-text-tertiary)" }}>
              Tap in your 4-digit PIN to unlock.
            </p>
          )}
        </div>

        {rateLimited ? (
          <div
            className="flex w-full max-w-xs flex-col items-center gap-3 rounded-xl border p-4 text-center"
            style={{
              borderColor: "var(--atlas-border)",
              background: "var(--atlas-bg-surface)",
              boxShadow: "var(--atlas-shadow)",
            }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold tabular-nums"
              style={{
                background: "var(--atlas-amber-soft)",
                color: "var(--atlas-amber)",
              }}
            >
              <TimerIcon className="size-4" />
              Try again in 4:32
            </span>
            <p className="text-sm font-bold">Too many attempts</p>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--atlas-text-secondary)" }}
            >
              PIN checks are limited per device to keep this iPad secure. The
              keypad unlocks automatically once the timer runs out.
            </p>
          </div>
        ) : null}

        {/* Keypad */}
        <div className="grid w-full max-w-xs grid-cols-3 gap-3">
          {keypad.map((key, index) => {
            if (!key) return <span key={`gap-${index}`} />;
            const isBack = key.value === "back";
            return (
              <button
                key={key.value}
                type="button"
                disabled={rateLimited}
                aria-label={isBack ? "Backspace" : `Digit ${key.value}`}
                onClick={() => press(key.value)}
                className={cn(
                  "flex h-14 items-center justify-center rounded-xl border text-xl font-bold transition-colors",
                  rateLimited
                    ? "opacity-40"
                    : "hover:border-[var(--atlas-border-strong)] hover:bg-[var(--atlas-bg-muted)] active:bg-[var(--atlas-bg-hover)]"
                )}
                style={{
                  borderColor: "var(--atlas-border)",
                  background: "var(--atlas-bg-surface)",
                  color: isBack
                    ? "var(--atlas-text-secondary)"
                    : "var(--atlas-text-primary)",
                  cursor: rateLimited ? "not-allowed" : undefined,
                }}
              >
                {isBack ? <DeleteIcon className="size-5" /> : key.value}
              </button>
            );
          })}
        </div>

        {/* Forgot PIN */}
        <button
          type="button"
          className="text-sm font-bold underline-offset-4 transition-colors hover:underline"
          style={{ color: "var(--atlas-text-secondary)" }}
        >
          Forgot PIN?
        </button>
      </div>

      {/* Security hint footer */}
      <div
        className="flex items-center justify-center gap-2 border-t px-6 py-4 text-center"
        style={{ borderColor: "var(--atlas-border)" }}
      >
        <ShieldCheckIcon
          className="size-4 shrink-0"
          style={{ color: "var(--atlas-accent)" }}
        />
        <span
          className="text-xs font-bold"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          Approved device · PIN checked by the server
        </span>
      </div>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "pin-unlock",
  title: "PIN unlock",
  description:
    "Locked approved device — device proof plus a server-verified, rate-limited 4-digit PIN.",
  viewport: "phone",
  states: [
    { id: "idle", label: "Idle" },
    { id: "wrong-pin", label: "Wrong PIN" },
    { id: "rate-limited", label: "Rate limited" },
  ],
  Component,
};
