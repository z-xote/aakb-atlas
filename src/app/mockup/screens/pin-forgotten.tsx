"use client";

import {
  ArrowLeftIcon,
  KeyRoundIcon,
  LogOutIcon,
  ShieldCheckIcon,
  TerminalIcon,
} from "lucide-react";

import type { MockupScreen } from "../types";
import { mockDevice } from "../mock-data";

const resetSteps: Array<{ icon: typeof LogOutIcon; text: string }> = [
  {
    icon: LogOutIcon,
    text: "Existing sessions on this device are signed out.",
  },
  {
    icon: ShieldCheckIcon,
    text: "The device proves itself again — no re-enrolment needed.",
  },
  {
    icon: KeyRoundIcon,
    text: "You set a fresh PIN and unlock as normal.",
  },
];

function Component() {
  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
        {/* Soft icon */}
        <span
          className="grid size-14 place-items-center"
          style={{
            borderRadius: "var(--atlas-radius)",
            background: "var(--atlas-accent-soft)",
            color: "var(--atlas-accent)",
          }}
        >
          <KeyRoundIcon className="size-7" />
        </span>

        {/* Headline (exact product copy) */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-bold tracking-normal">
            Ask your developer to reset the PIN.
          </h1>
          <p
            className="max-w-xs text-sm leading-relaxed"
            style={{ color: "var(--atlas-text-secondary)" }}
          >
            PINs aren&apos;t self-serve. A developer or the AI agent resets it
            from the terminal — here&apos;s what that does:
          </p>
        </div>

        {/* What the reset does */}
        <ul className="flex w-full max-w-xs flex-col gap-2">
          {resetSteps.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-3 rounded-lg border p-3"
              style={{
                borderColor: "var(--atlas-border)",
                background: "var(--atlas-bg-surface)",
              }}
            >
              <Icon
                className="mt-0.5 size-4 shrink-0"
                style={{ color: "var(--atlas-accent)" }}
              />
              <span
                className="text-sm leading-snug"
                style={{ color: "var(--atlas-text-secondary)" }}
              >
                {text}
              </span>
            </li>
          ))}
        </ul>

        {/* Terminal hint */}
        <div className="w-full max-w-xs">
          <div
            className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-normal"
            style={{ color: "var(--atlas-text-tertiary)" }}
          >
            <TerminalIcon className="size-3.5" />
            Reset command
          </div>
          <pre
            className="overflow-x-auto rounded-lg border px-3 py-2.5 text-xs font-bold"
            style={{
              borderColor: "var(--atlas-border-strong)",
              background: "var(--atlas-bg-muted)",
              color: "var(--atlas-text-primary)",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            atlas devices reset-pin &quot;{mockDevice.name}&quot;
          </pre>
        </div>
      </div>

      {/* Back to unlock */}
      <div
        className="border-t px-6 py-4"
        style={{ borderColor: "var(--atlas-border)" }}
      >
        <button
          type="button"
          className="atlas-btn atlas-btn-outline h-11 w-full"
        >
          <ArrowLeftIcon />
          Back to unlock
        </button>
      </div>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "pin-forgotten",
  title: "Forgotten PIN",
  description:
    "Forgotten PINs are not self-serve — a developer resets from the terminal.",
  viewport: "phone",
  Component,
};
