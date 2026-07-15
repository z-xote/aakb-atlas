"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckIcon,
  DeleteIcon,
  FolderKanbanIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  LogOutIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TerminalIcon,
  TimerIcon,
} from "lucide-react";

import {
  createBrowserDevice,
  loadBrowserDevice,
  signDevicePayload,
  updateBrowserDevice,
  type BrowserDeviceIdentity,
} from "@/features/auth/browser-device";
import { cn } from "@/lib/utils";

type Mode = "loading" | "enroll" | "waiting" | "unlock" | "set_pin" | "forgotten" | "error";
type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; details?: Record<string, number> } };

const PIN_LENGTH = 4;
const keypad: Array<string | null> = ["1", "2", "3", "4", "5", "6", "7", "8", "9", null, "0", "back"];

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!body.ok) {
    const error = new Error(body.error.message) as Error & { code?: string; details?: Record<string, number> };
    error.code = body.error.code;
    error.details = body.error.details;
    throw error;
  }
  return body.data;
}

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

function PinDots({ count, error = false }: { count: number; error?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-4" aria-label={`${count} of ${PIN_LENGTH} PIN digits entered`}>
      {Array.from({ length: PIN_LENGTH }).map((_, index) => {
        const filled = index < count;
        const tone = error ? "var(--destructive)" : "var(--atlas-accent)";
        return (
          <span
            aria-hidden="true"
            className="size-3.5 rounded-full border-2 transition-colors"
            key={index}
            style={{
              borderColor: filled ? tone : "var(--atlas-border-strong)",
              background: filled ? tone : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

function PinKeypad({
  busy,
  onPress,
}: {
  busy: boolean;
  onPress: (key: string) => void;
}) {
  return (
    <div className="grid w-full max-w-xs grid-cols-3 gap-3">
      {keypad.map((key, index) => {
        if (!key) return <span key={`gap-${index}`} />;
        const isBack = key === "back";
        return (
          <button
            aria-label={isBack ? "Backspace" : `Digit ${key}`}
            className={cn(
              "flex h-14 items-center justify-center rounded-xl border text-xl font-bold transition-colors",
              busy
                ? "opacity-40"
                : "hover:border-[var(--atlas-border-strong)] hover:bg-[var(--atlas-bg-muted)] active:bg-[var(--atlas-bg-hover)]"
            )}
            disabled={busy}
            key={key}
            onClick={() => onPress(key)}
            style={{
              borderColor: "var(--atlas-border)",
              background: isBack ? "transparent" : "var(--atlas-bg-surface)",
              color: isBack ? "var(--atlas-text-secondary)" : "var(--atlas-text-primary)",
            }}
            type="button"
          >
            {isBack ? <DeleteIcon className="size-5" /> : key}
          </button>
        );
      })}
    </div>
  );
}

export function DeviceLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [identity, setIdentity] = useState<BrowserDeviceIdentity | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  const refreshStatus = useCallback(async (current: BrowserDeviceIdentity) => {
    if (!current.enrollmentId) return;
    const status = await api<{ status: string; deviceId: string | null }>(
      `/api/device/enrollments/${current.enrollmentId}`
    );
    if (status.status === "approved" && status.deviceId) {
      const updated = await updateBrowserDevice({ deviceId: status.deviceId, needsPin: true });
      setIdentity(updated);
      setPin("");
      setFirstPin("");
      setMode("set_pin");
    } else if (status.status === "expired" || status.status === "denied") {
      setMessage(`This enrollment is ${status.status}. Ask the developer to start a fresh enrollment.`);
      setMode("error");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const current = await loadBrowserDevice();
        setIdentity(current ?? null);
        if (!current) setMode("enroll");
        else if (current.deviceId) setMode(current.needsPin ? "set_pin" : "unlock");
        else if (current.enrollmentId) {
          setMode("waiting");
          await refreshStatus(current);
        } else setMode("enroll");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Atlas could not read this browser's device key.");
        setMode("error");
      }
    })();
  }, [refreshStatus]);

  useEffect(() => {
    if (mode !== "waiting" || !identity) return;
    const timer = window.setInterval(() => void refreshStatus(identity).catch(() => undefined), 2500);
    return () => window.clearInterval(timer);
  }, [identity, mode, refreshStatus]);

  async function beginEnrollment() {
    setBusy(true);
    setMessage(null);
    try {
      const current = identity ?? (await createBrowserDevice(deviceName.trim() || "Atlas device"));
      const enrollment = await api<{
        enrollmentId: string;
        proofChallenge: string;
        code: string;
        shortFingerprint: string;
      }>("/api/device/enrollments", {
        method: "POST",
        body: JSON.stringify({
          deviceName: deviceName.trim() || current.deviceName,
          clientInstanceId: current.clientInstanceId,
          publicKey: current.publicKey,
        }),
      });
      const signature = await signDevicePayload(enrollment.proofChallenge);
      await api(`/api/device/enrollments/${enrollment.enrollmentId}/prove`, {
        method: "POST",
        body: JSON.stringify({ signature }),
      });
      const updated = await updateBrowserDevice({
        enrollmentId: enrollment.enrollmentId,
        activationCode: enrollment.code,
        shortFingerprint: enrollment.shortFingerprint,
        deviceName: deviceName.trim() || current.deviceName,
      });
      setIdentity(updated);
      setMode("waiting");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Atlas could not enroll this device.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPin(pinValue: string, confirmValue = pinValue) {
    if (!identity?.deviceId || pinValue.length !== PIN_LENGTH) return;
    setBusy(true);
    setMessage(null);
    setRetryAfterSeconds(0);
    try {
      const purpose = mode === "set_pin" ? "pin_set" : "unlock";
      const challenge = await api<{ challengeId: string; payload: string }>("/api/device/challenges", {
        method: "POST",
        body: JSON.stringify({ deviceId: identity.deviceId, purpose }),
      });
      const signature = await signDevicePayload(challenge.payload);
      if (mode === "set_pin") {
        await api(`/api/device/enrollments/${identity.enrollmentId ?? "approved"}/pin`, {
          method: "POST",
          body: JSON.stringify({ challengeId: challenge.challengeId, signature, pin: pinValue, confirmPin: confirmValue }),
        });
        const updated = await updateBrowserDevice({ needsPin: false });
        setIdentity(updated);
      } else {
        await api("/api/device/verify", {
          method: "POST",
          body: JSON.stringify({ challengeId: challenge.challengeId, signature, pin: pinValue }),
        });
      }
      router.push("/files");
      router.refresh();
    } catch (error) {
      const authError = error as Error & { code?: string; details?: Record<string, number> };
      if (authError.code === "pin_setup_required") {
        await updateBrowserDevice({ needsPin: true });
        setFirstPin("");
        setMode("set_pin");
        setMessage("Your PIN was reset. Choose a new four-digit PIN.");
      } else if (authError.details?.retryAfterSeconds) {
        setRetryAfterSeconds(authError.details.retryAfterSeconds);
        setMessage(`${authError.message} Try again in ${authError.details.retryAfterSeconds} seconds.`);
      } else if (typeof authError.details?.remainingAttempts === "number") {
        setMessage(`${authError.message} ${authError.details.remainingAttempts} attempts remain.`);
      } else {
        setMessage(authError.message || "Atlas could not unlock this device.");
      }
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  function pressPin(key: string) {
    if (busy || (mode !== "unlock" && mode !== "set_pin")) return;
    if (key === "back") {
      setPin((current) => current.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + key;
    setPin(next);
    setMessage(null);
    if (next.length < PIN_LENGTH) return;

    if (mode === "unlock") {
      void submitPin(next);
      return;
    }

    if (!firstPin) {
      setFirstPin(next);
      setPin("");
      return;
    }

    if (next !== firstPin) {
      setFirstPin("");
      setPin("");
      setMessage("Those didn't match. Set your PIN again.");
      return;
    }

    void submitPin(firstPin, next);
  }

  function handlePinKey(event: React.KeyboardEvent) {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      pressPin(event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      pressPin("back");
    }
  }

  if (mode === "loading") {
    return (
      <div className="atlas-login-card justify-items-center text-center">
        <LoaderCircleIcon className="size-8 animate-spin" style={{ color: "var(--atlas-accent)" }} />
        <p className="atlas-muted">Checking this browser&apos;s device key…</p>
      </div>
    );
  }

  if (mode === "enroll") {
    return (
      <div className="atlas-login-card">
        <Brand />
        <div className="grid gap-2 text-center">
          <h1>This device isn&apos;t approved yet</h1>
          <p className="atlas-muted text-sm">Name this device, then Atlas will create its private signing key.</p>
        </div>
        <label className="atlas-login-field">
          <span>Device name</span>
          <input onChange={(event) => setDeviceName(event.target.value)} placeholder="Site iPad" value={deviceName} />
        </label>
        <p className="atlas-muted text-sm">The encrypted private key never leaves this device.</p>
        <button className="atlas-login-submit" disabled={busy} onClick={() => void beginEnrollment()} type="button">
          <KeyRoundIcon /> {busy ? "Creating device key…" : "Create activation code"}
        </button>
        {message ? <p className="atlas-login-error" role="alert">{message}</p> : null}
      </div>
    );
  }

  if (mode === "waiting" && identity) {
    return (
      <div className="atlas-login-card">
        <Brand />
        <div className="grid justify-items-center gap-4 text-center">
          <span className="relative grid size-16 place-items-center rounded-full" style={{ background: "var(--atlas-accent-soft)" }}>
            <span className="absolute inline-flex size-16 animate-ping rounded-full opacity-40" style={{ background: "var(--atlas-accent)" }} />
            <SmartphoneIcon className="relative size-7" style={{ color: "var(--atlas-accent)" }} />
          </span>
          <div className="grid gap-1.5">
            <h1>Waiting for approval</h1>
            <p className="atlas-muted text-sm">Ask your developer to run the approval from the terminal. This screen updates on its own.</p>
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border p-5 text-center" style={{ borderColor: "var(--atlas-accent-muted)", background: "var(--atlas-accent-soft)" }}>
          <span className="atlas-eyebrow" style={{ color: "var(--atlas-accent)" }}>Activation code</span>
          <strong className="font-mono text-4xl font-bold tabular-nums" style={{ color: "var(--atlas-accent)", letterSpacing: "0.12em" }}>{identity.activationCode}</strong>
          <span className="inline-flex items-center justify-center gap-2 text-xs font-bold">
            <span className="relative flex size-2.5 items-center justify-center" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full opacity-70" style={{ background: "var(--atlas-accent)" }} />
              <span className="relative inline-flex size-2 rounded-full" style={{ background: "var(--atlas-accent)" }} />
            </span>
            Waiting to be approved
          </span>
        </div>
        <div className="grid gap-2">
          <span className="atlas-eyebrow inline-flex items-center gap-1.5"><TerminalIcon className="size-3" />Owner approves from the CLI</span>
          <code className="rounded-lg border p-3 text-xs" style={{ background: "var(--atlas-bg-muted)", borderColor: "var(--atlas-border-strong)" }}>atlas devices approve {identity.activationCode}</code>
        </div>
        <div className="grid gap-1.5">
          <span className="atlas-eyebrow inline-flex items-center gap-1.5"><KeyRoundIcon className="size-3" />Device key fingerprint</span>
          <code className="break-all text-[11px]">{identity.shortFingerprint}</code>
        </div>
        <p className="atlas-muted text-xs">This code expires after 15 minutes.</p>
      </div>
    );
  }

  if (mode === "forgotten") {
    const resetSteps = [
      { icon: LogOutIcon, text: "Existing sessions on this device are signed out." },
      { icon: ShieldCheckIcon, text: "The device proves itself again — no re-enrolment needed." },
      { icon: KeyRoundIcon, text: "You set a fresh PIN and unlock as normal." },
    ];
    return (
      <div className="atlas-login-card">
        <div className="grid justify-items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-lg" style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}>
            <KeyRoundIcon className="size-7" />
          </span>
          <h1>Ask your developer to reset the PIN.</h1>
          <p className="atlas-muted text-sm">PINs aren&apos;t self-serve. A developer or the AI agent resets it from the terminal — here&apos;s what that does:</p>
        </div>
        <ul className="grid gap-2">
          {resetSteps.map(({ icon: Icon, text }) => (
            <li className="flex items-start gap-3 rounded-lg border p-3" key={text} style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-surface)" }}>
              <Icon className="mt-0.5 size-4 shrink-0" style={{ color: "var(--atlas-accent)" }} />
              <span className="atlas-muted text-sm">{text}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-2">
          <span className="atlas-eyebrow inline-flex items-center gap-1.5"><TerminalIcon className="size-3.5" />Reset command</span>
          <code className="overflow-x-auto rounded-lg border px-3 py-2.5 text-xs font-bold" style={{ borderColor: "var(--atlas-border-strong)", background: "var(--atlas-bg-muted)" }}>atlas devices reset-pin {identity?.deviceId ?? "<device-id>"}</code>
        </div>
        <button className="atlas-btn atlas-btn-outline h-11 w-full" onClick={() => setMode("unlock")} type="button">
          <ArrowLeftIcon /> Back to unlock
        </button>
      </div>
    );
  }

  if (mode === "unlock" || mode === "set_pin") {
    const settingPin = mode === "set_pin";
    const confirming = settingPin && Boolean(firstPin);
    const heading = settingPin ? (confirming ? "Confirm your PIN" : "Set this device's PIN") : "Enter your PIN";
    const hint = settingPin
      ? confirming
        ? "Enter the same 4 digits again to confirm."
        : "Choose a 4-digit PIN to unlock Atlas on this device."
      : "Tap in your 4-digit PIN to unlock.";
    return (
      <div className="atlas-login-card" onKeyDown={handlePinKey} tabIndex={-1}>
        <div className="grid justify-items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-full" style={{ background: settingPin ? "var(--atlas-green-soft)" : "var(--atlas-accent-soft)", color: settingPin ? "var(--atlas-green)" : "var(--atlas-accent)" }}>
            {settingPin ? <ShieldCheckIcon className="size-7" /> : <FolderKanbanIcon className="size-6" />}
          </span>
          {settingPin ? <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--atlas-green)" }}><CheckIcon className="size-4" />Device approved</span> : null}
          <div className="grid gap-1">
            <span className="atlas-eyebrow">{identity?.deviceName ?? "Approved device"}</span>
            <h1>{heading}</h1>
            <p className="atlas-muted text-sm">{hint}</p>
          </div>
        </div>
        <PinDots count={pin.length} error={Boolean(message) && !retryAfterSeconds} />
        <div className="flex min-h-6 items-center justify-center px-2 text-center">
          {retryAfterSeconds ? (
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold" style={{ background: "var(--atlas-amber-soft)", color: "var(--atlas-amber)" }}>
              <TimerIcon className="size-4" /> Try again in {retryAfterSeconds}s
            </span>
          ) : message ? (
            <p className="atlas-login-error" role="alert">{message}</p>
          ) : (
            <p className="atlas-muted text-sm">{busy ? "Verifying…" : hint}</p>
          )}
        </div>
        <PinKeypad busy={busy || retryAfterSeconds > 0} onPress={pressPin} />
        {!settingPin ? (
          <button className="atlas-muted text-sm font-bold underline-offset-4 hover:underline" onClick={() => setMode("forgotten")} type="button">Forgot PIN?</button>
        ) : null}
        <div className="flex items-center justify-center gap-2 border-t pt-4 text-center" style={{ borderColor: "var(--atlas-border)" }}>
          <ShieldCheckIcon className="size-4 shrink-0" style={{ color: "var(--atlas-accent)" }} />
          <span className="atlas-eyebrow">Approved device · PIN checked by the server</span>
        </div>
      </div>
    );
  }

  return (
    <div className="atlas-login-card">
      <Brand />
      <h1>Device enrollment needs attention</h1>
      <p className="atlas-muted text-sm">The developer needs to inspect this device enrollment before it can continue.</p>
      {message ? <p className="atlas-login-error" role="alert">{message}</p> : null}
    </div>
  );
}
