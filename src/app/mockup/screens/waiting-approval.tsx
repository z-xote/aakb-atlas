"use client";

import { useState } from "react";
import {
  CheckIcon,
  DeleteIcon,
  FolderKanbanIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MockupScreen, MockupScreenProps } from "../types";
import { mockDevice } from "../mock-data";

/* ------------------------------------------------------------------ */
/* Waiting                                                             */
/* ------------------------------------------------------------------ */

function WaitingBody() {
  return (
    <div className="grid gap-7 text-center">
      <div className="atlas-login-brand justify-center">
        <div className="atlas-login-mark">
          <FolderKanbanIcon className="size-5" />
        </div>
        <div className="text-left">
          <div className="atlas-eyebrow">Atlas</div>
          <p className="atlas-muted text-sm">All About Kitchens &amp; Bathrooms</p>
        </div>
      </div>

      {/* Animated indicator */}
      <div className="grid justify-items-center gap-4">
        <span
          className="relative grid size-16 place-items-center rounded-full"
          style={{ background: "var(--atlas-accent-soft)" }}
        >
          <span
            className="absolute inline-flex size-16 animate-ping rounded-full opacity-40"
            style={{ background: "var(--atlas-accent)" }}
          />
          <SmartphoneIcon className="relative size-7" style={{ color: "var(--atlas-accent)" }} />
        </span>
        <div className="grid gap-1.5">
          <h1 className="text-xl font-bold tracking-normal">Waiting for approval</h1>
          <p className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
            Ask your developer to run the approval from the terminal. This screen updates on its own.
          </p>
        </div>
      </div>

      {/* Device + code recap */}
      <div
        className="grid gap-2 rounded-lg border p-4 text-left"
        style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="atlas-label">Device</span>
          <span className="text-sm font-bold">{mockDevice.name}</span>
        </div>
        <div
          className="flex items-center justify-between gap-3 border-t pt-2"
          style={{ borderColor: "var(--atlas-border)" }}
        >
          <span className="atlas-label">Activation code</span>
          <span
            className="font-mono text-sm font-bold tabular-nums"
            style={{ letterSpacing: "0.08em" }}
          >
            {mockDevice.activationCode}
          </span>
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
        This code expires after a while. If it does, tap{" "}
        <span className="font-bold">Generate a new code</span> on the previous screen.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Approved — set PIN                                                  */
/* ------------------------------------------------------------------ */

type PinStep = "set" | "confirm" | "done";

const stepCopy: Record<PinStep, { title: string; hint: string }> = {
  set: { title: "Set this device's PIN", hint: "Choose a 4-digit PIN to unlock Atlas on this device." },
  confirm: { title: "Confirm your PIN", hint: "Enter the same 4 digits again to confirm." },
  done: { title: "PIN set", hint: "This device is ready. You won't need the code again." },
};

function PinDots({ count, done }: { count: number; done: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {[0, 1, 2, 3].map((i) => {
        const filled = i < count;
        return (
          <span
            key={i}
            className="size-3.5 rounded-full transition-colors"
            style={{
              background: done
                ? "var(--atlas-green)"
                : filled
                  ? "var(--atlas-accent)"
                  : "var(--atlas-bg-hover)",
            }}
          />
        );
      })}
    </div>
  );
}

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

function ApprovedBody() {
  const [step, setStep] = useState<PinStep>("set");
  const [firstPin, setFirstPin] = useState("");
  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);

  const press = (key: (typeof keys)[number]) => {
    if (key === "") return;
    if (step === "done") return;

    if (key === "back") {
      setEntry((e) => e.slice(0, -1));
      return;
    }

    if (entry.length >= 4) return;
    const next = entry + key;

    if (next.length < 4) {
      setEntry(next);
      setError(null);
      return;
    }

    // 4th digit entered
    if (step === "set") {
      setFirstPin(next);
      setEntry("");
      setError(null);
      setStep("confirm");
      return;
    }

    // step === "confirm"
    if (next === firstPin) {
      setEntry(next);
      setStep("done");
    } else {
      setFirstPin("");
      setEntry("");
      setError("Those didn't match. Set your PIN again.");
      setStep("set");
    }
  };

  const copy = stepCopy[step];
  const done = step === "done";

  return (
    <div className="grid gap-6">
      {/* Success moment */}
      <div className="grid justify-items-center gap-3 text-center">
        <span
          className="grid size-14 place-items-center rounded-full"
          style={{ background: "var(--atlas-green-soft)" }}
        >
          <ShieldCheckIcon className="size-7" style={{ color: "var(--atlas-green)" }} />
        </span>
        <div className="grid gap-0.5">
          <span
            className="inline-flex items-center justify-center gap-1.5 text-sm font-bold"
            style={{ color: "var(--atlas-green)" }}
          >
            <CheckIcon className="size-4" />
            Device approved
          </span>
          <span className="text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
            {mockDevice.name}
          </span>
        </div>
      </div>

      {/* PIN creation */}
      <div className="grid gap-4 text-center">
        <div className="grid gap-1">
          <h1 className="text-xl font-bold tracking-normal">{copy.title}</h1>
          <p className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
            {copy.hint}
          </p>
        </div>

        {done ? (
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold"
            style={{ background: "var(--atlas-green-soft)", color: "var(--atlas-green)" }}
          >
            <CheckIcon className="size-4" />
            PIN set
          </div>
        ) : (
          <PinDots count={entry.length} done={false} />
        )}

        {done ? <PinDots count={4} done /> : null}

        {error ? (
          <p className="text-xs font-bold" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
        ) : null}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((key, i) => {
          if (key === "") return <span key={`blank-${i}`} />;
          const isBack = key === "back";
          return (
            <button
              key={key}
              type="button"
              disabled={done}
              onClick={() => press(key)}
              aria-label={isBack ? "Delete" : `Digit ${key}`}
              className={cn(
                "grid h-14 place-items-center rounded-lg border text-xl font-bold transition-colors",
                "disabled:opacity-40"
              )}
              style={{
                borderColor: "var(--atlas-border)",
                background: isBack ? "transparent" : "var(--atlas-bg-surface)",
                color: "var(--atlas-text-primary)",
              }}
            >
              {isBack ? (
                <DeleteIcon className="size-5" style={{ color: "var(--atlas-text-secondary)" }} />
              ) : (
                key
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Component({ stateId }: MockupScreenProps) {
  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ background: "var(--atlas-bg-root)", color: "var(--atlas-text-primary)" }}
    >
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="atlas-login-card">
          {stateId === "approved" ? <ApprovedBody /> : <WaitingBody />}
        </div>
      </div>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "waiting-approval",
  title: "Waiting for approval",
  description:
    "The device polls until the owner approves it, then immediately sets its own four-digit PIN.",
  viewport: "phone",
  states: [
    { id: "waiting", label: "Waiting" },
    { id: "approved", label: "Approved — set PIN" },
  ],
  Component,
};
