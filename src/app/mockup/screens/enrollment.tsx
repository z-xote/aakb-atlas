"use client";

import { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  FolderKanbanIcon,
  KeyRoundIcon,
  SmartphoneIcon,
  TerminalIcon,
} from "lucide-react";

import type { MockupScreen, MockupScreenProps } from "../types";
import { mockDevice } from "../mock-data";

const cliCommand = `atlas devices approve ${mockDevice.activationCode.replace(/\s/g, "")}`;

function Brand() {
  return (
    <div className="atlas-login-brand">
      <div className="atlas-login-mark">
        <FolderKanbanIcon className="size-5" />
      </div>
      <div>
        <div className="atlas-eyebrow">Atlas</div>
        <p className="atlas-muted text-sm">All About Kitchens &amp; Bathrooms</p>
      </div>
    </div>
  );
}

function DeviceRow() {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border p-3"
      style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg"
        style={{ background: "var(--atlas-bg-surface)", color: "var(--atlas-text-secondary)" }}
      >
        <SmartphoneIcon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{mockDevice.name}</span>
        <span className="block truncate text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
          {mockDevice.model}
        </span>
      </span>
    </div>
  );
}

function Fingerprint() {
  return (
    <div className="grid gap-1.5">
      <span className="atlas-label inline-flex items-center gap-1.5">
        <KeyRoundIcon className="size-3" />
        Device key fingerprint
      </span>
      <code
        className="block break-all font-mono text-[11px] leading-relaxed"
        style={{ color: "var(--atlas-text-secondary)" }}
      >
        {mockDevice.fingerprint}
      </code>
    </div>
  );
}

function KeyGeneratingBody() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-xl font-bold tracking-normal">Creating this device&rsquo;s key&hellip;</h1>
        <p className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
          Generating a PGP key pair on this device. It never leaves this iPad.
        </p>
      </div>

      {/* Skeleton where the activation code will land */}
      <div
        className="grid gap-3 rounded-lg border p-5 text-center"
        style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}
      >
        <span className="atlas-label">Activation code</span>
        <div className="flex items-center justify-center gap-3">
          <span
            className="h-11 w-20 animate-pulse rounded-md"
            style={{ background: "var(--atlas-bg-hover)" }}
          />
          <span
            className="h-11 w-20 animate-pulse rounded-md"
            style={{ background: "var(--atlas-bg-hover)" }}
          />
        </div>
      </div>

      <DeviceRow />
    </div>
  );
}

function CodeReadyBody() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    setCopied(true);
    try {
      navigator.clipboard?.writeText(cliCommand);
    } catch {
      /* clipboard unavailable in mock frame */
    }
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-xl font-bold tracking-normal">This device isn&rsquo;t approved yet</h1>
        <p className="text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
          Share this code with the owner so they can approve it.
        </p>
      </div>

      {/* Activation code */}
      <div
        className="grid gap-3 rounded-lg border p-5 text-center"
        style={{ borderColor: "var(--atlas-accent-muted)", background: "var(--atlas-accent-soft)" }}
      >
        <span className="atlas-label" style={{ color: "var(--atlas-accent)" }}>
          Activation code
        </span>
        <div
          className="font-mono text-5xl font-bold tabular-nums"
          style={{ color: "var(--atlas-accent)", letterSpacing: "0.12em" }}
        >
          {mockDevice.activationCode}
        </div>
        <span
          className="inline-flex items-center justify-center gap-2 text-xs font-bold"
          style={{ color: "var(--atlas-text-secondary)" }}
        >
          <span
            className="relative flex size-2.5 items-center justify-center"
            aria-hidden="true"
          >
            <span
              className="absolute inline-flex size-full animate-ping rounded-full opacity-70"
              style={{ background: "var(--atlas-accent)" }}
            />
            <span
              className="relative inline-flex size-2 rounded-full"
              style={{ background: "var(--atlas-accent)" }}
            />
          </span>
          Waiting to be approved
        </span>
      </div>

      <DeviceRow />

      {/* CLI instructions for the owner */}
      <div className="grid gap-2">
        <span className="atlas-label inline-flex items-center gap-1.5">
          <TerminalIcon className="size-3" />
          Owner approves from the CLI
        </span>
        <div
          className="flex items-center gap-2 rounded-lg border p-2.5"
          style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}
        >
          <code
            className="min-w-0 flex-1 truncate font-mono text-xs"
            style={{ color: "var(--atlas-text-primary)" }}
          >
            <span style={{ color: "var(--atlas-text-tertiary)" }}>$ </span>
            {cliCommand}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy approval command"
            className="atlas-icon-button atlas-icon-button-bordered shrink-0"
          >
            {copied ? (
              <CheckIcon style={{ color: "var(--atlas-green)" }} />
            ) : (
              <CopyIcon />
            )}
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--atlas-text-tertiary)" }}>
          The owner or an AI agent runs this from a terminal. Nothing to type on this device.
        </p>
      </div>

      <Fingerprint />

      <div className="flex justify-center pt-1">
        <button
          type="button"
          className="text-xs font-bold underline-offset-4 hover:underline"
          style={{ color: "var(--atlas-text-secondary)" }}
        >
          Generate a new code
        </button>
      </div>
    </div>
  );
}

function Component({ stateId }: MockupScreenProps) {
  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ background: "var(--atlas-bg-root)", color: "var(--atlas-text-primary)" }}
    >
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="atlas-login-card">
          <Brand />
          {stateId === "key-generating" ? <KeyGeneratingBody /> : <CodeReadyBody />}
        </div>
      </div>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "enrollment",
  title: "Device enrollment",
  description:
    "An unknown device generates its own key and shows an activation code for the owner to approve via the CLI.",
  viewport: "phone",
  states: [
    { id: "code-ready", label: "Code ready" },
    { id: "key-generating", label: "Generating key" },
  ],
  Component,
};
