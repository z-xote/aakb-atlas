"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ThemeMode = "dark" | "light";

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  window.localStorage.setItem("atlas-theme", mode);
}

function subscribeToTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getTheme(): ThemeMode {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mode = useSyncExternalStore(subscribeToTheme, getTheme, () => "dark");

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function choose(nextMode: ThemeMode) {
    applyTheme(nextMode);
    setOpen(false);
  }

  const Icon = mode === "dark" ? MoonIcon : SunIcon;

  return (
    <div className="atlas-menu-root" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Theme"
        className="atlas-icon-button atlas-icon-button-bordered"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Icon />
      </button>

      {open ? (
        <div className="atlas-theme-menu" role="menu">
          <button
            className={cn("atlas-theme-menu-item", mode === "dark" && "atlas-active")}
            onClick={() => choose("dark")}
            role="menuitem"
            type="button"
          >
            <MoonIcon />
            Night
          </button>
          <button
            className={cn("atlas-theme-menu-item", mode === "light" && "atlas-active")}
            onClick={() => choose("light")}
            role="menuitem"
            type="button"
          >
            <SunIcon />
            Day
          </button>
        </div>
      ) : null}
    </div>
  );
}
