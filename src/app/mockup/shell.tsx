"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  LayersIcon,
  MonitorIcon,
  MoonIcon,
  SmartphoneIcon,
  SunIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { screens } from "./screens";
import type { MockupViewport } from "./types";

const surface: React.CSSProperties = {
  borderColor: "var(--atlas-border)",
  background: "var(--atlas-bg-surface)",
  color: "var(--atlas-text-primary)",
};

function screenIndexFromHash(): number {
  const slug = window.location.hash.replace(/^#/, "");
  const index = screens.findIndex((screen) => screen.id === slug);
  return index >= 0 ? index : 0;
}

function subscribeToHash(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function subscribeToThemeClass(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function MockupShell() {
  const [stateIds, setStateIds] = useState<Record<string, string>>({});
  const [viewportOverride, setViewportOverride] = useState<MockupViewport | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const index = useSyncExternalStore(subscribeToHash, screenIndexFromHash, () => 0);
  const dark = useSyncExternalStore(
    subscribeToThemeClass,
    () => document.documentElement.classList.contains("dark"),
    () => true
  );

  const screen = screens[index];
  const stateId = stateIds[screen.id] ?? screen.states?.[0]?.id ?? "default";
  const viewport: MockupViewport = viewportOverride ?? screen.viewport ?? "desktop";

  const goTo = useCallback((next: number) => {
    const bounded = (next + screens.length) % screens.length;
    setViewportOverride(null);
    setListOpen(false);
    window.history.replaceState(null, "", `#${screens[bounded].id}`);
    // replaceState doesn't emit hashchange, so nudge the store subscribers.
    window.dispatchEvent(new Event("hashchange"));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem("atlas-theme", next ? "dark" : "light");
    } catch {
      // storage unavailable — theme still toggles for this visit
    }
  };

  const Component = screen.Component;
  const content = useMemo(
    () => <Component key={`${screen.id}-${stateId}`} stateId={stateId} />,
    [Component, screen.id, stateId]
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--atlas-bg-root)" }}>
      {viewport === "desktop" ? (
        <div className="flex min-h-screen flex-col">{content}</div>
      ) : (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div
            className="flex max-w-full overflow-hidden rounded-[2.2rem] border-[10px] shadow-2xl"
            style={{
              borderColor: "var(--atlas-border-strong)",
              background: "var(--atlas-bg-root)",
              width: viewport === "phone" ? 393 : 844,
              height:
                viewport === "phone"
                  ? "min(760px, calc(100vh - 48px))"
                  : "min(393px, calc(100vh - 48px))",
            }}
          >
            <div className="flex-1 overflow-y-auto">
              <div className="flex min-h-full flex-col">{content}</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating mockup controls */}
      <aside
        aria-label="Mockup controls"
        className="fixed bottom-5 right-5 z-50 flex w-[300px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-xl border text-sm"
        style={{ ...surface, boxShadow: "var(--atlas-shadow)" }}
      >
        <button
          className="flex items-center gap-2 px-3.5 py-2.5 text-left"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          <span
            className="grid size-6 shrink-0 place-items-center rounded-md"
            style={{ background: "var(--atlas-accent-soft)", color: "var(--atlas-accent)" }}
          >
            <LayersIcon className="size-3.5" />
          </span>
          <span className="atlas-eyebrow">v0.2 mockup</span>
          <span className="ml-auto text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
            {index + 1} / {screens.length}
          </span>
          {collapsed ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
        </button>

        {!collapsed ? (
          <div className="flex flex-col gap-3 border-t px-3.5 pb-3.5 pt-3" style={{ borderColor: "var(--atlas-border)" }}>
            <div>
              <p className="font-bold leading-tight">{screen.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--atlas-text-secondary)" }}>
                {screen.description}
              </p>
            </div>

            {screen.states && screen.states.length > 1 ? (
              <div className="flex flex-wrap gap-1.5">
                {screen.states.map((state) => {
                  const active = state.id === stateId;
                  return (
                    <button
                      className="h-6 rounded-full border px-2.5 text-[11px] font-bold transition-colors"
                      key={state.id}
                      onClick={() =>
                        setStateIds((prev) => ({ ...prev, [screen.id]: state.id }))
                      }
                      style={{
                        borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)",
                        background: active ? "var(--atlas-accent)" : "var(--atlas-bg-muted)",
                        color: active ? "#fff" : "var(--atlas-text-secondary)",
                      }}
                      type="button"
                    >
                      {state.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "desktop" as const, icon: MonitorIcon, label: "Desktop" },
                  { id: "phone" as const, icon: SmartphoneIcon, label: "Phone" },
                  { id: "phone-landscape" as const, icon: SmartphoneIcon, label: "Phone landscape", rotate: true },
                ]
              ).map(({ id, icon: Icon, label, rotate }) => {
                const active = viewport === id;
                return (
                  <button
                    aria-label={label}
                    aria-pressed={active}
                    className="atlas-icon-button atlas-icon-button-bordered"
                    key={id}
                    onClick={() => setViewportOverride(id)}
                    style={
                      active
                        ? { borderColor: "var(--atlas-accent)", color: "var(--atlas-accent)" }
                        : undefined
                    }
                    title={label}
                    type="button"
                  >
                    <Icon className={cn(rotate && "rotate-90")} />
                  </button>
                );
              })}
              <button
                aria-label="Toggle theme"
                className="atlas-icon-button atlas-icon-button-bordered ml-auto"
                onClick={toggleTheme}
                title="Toggle theme"
                type="button"
              >
                {dark ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>

            {listOpen ? (
              <div
                className="max-h-56 overflow-y-auto rounded-lg border p-1"
                style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)" }}
              >
                {screens.map((entry, entryIndex) => (
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-bold transition-colors"
                    key={entry.id}
                    onClick={() => goTo(entryIndex)}
                    style={{
                      background: entryIndex === index ? "var(--atlas-accent-soft)" : undefined,
                      color:
                        entryIndex === index
                          ? "var(--atlas-accent)"
                          : "var(--atlas-text-secondary)",
                    }}
                    type="button"
                  >
                    <span className="w-5 shrink-0 text-right tabular-nums opacity-60">
                      {entryIndex + 1}
                    </span>
                    <span className="truncate">{entry.title}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                className="atlas-btn atlas-btn-outline flex-1"
                onClick={() => goTo(index - 1)}
                type="button"
              >
                <ChevronLeftIcon />
                Back
              </button>
              <button
                aria-expanded={listOpen}
                className="atlas-btn atlas-btn-outline"
                onClick={() => setListOpen((value) => !value)}
                title="All screens"
                type="button"
              >
                <LayersIcon />
              </button>
              <button
                className="atlas-btn atlas-btn-primary flex-1"
                onClick={() => goTo(index + 1)}
                type="button"
              >
                Next
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
