"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2Icon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ExpandableImage({
  src,
  alt,
  className,
  imageClassName = "object-contain",
  sizes = "50vw",
  overlay,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  overlay?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const lastTouchAt = useRef(0);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function openFullView() {
    if (src) setOpen(true);
  }

  function handleTouch(pointerType: string) {
    if (pointerType !== "touch" && pointerType !== "pen") return;
    const now = Date.now();
    if (now - lastTouchAt.current < 350) {
      lastTouchAt.current = 0;
      openFullView();
    } else {
      lastTouchAt.current = now;
    }
  }

  return (
    <>
      <div
        className={cn("group relative min-w-0 overflow-hidden", className)}
        onDoubleClick={openFullView}
        onPointerUp={(event) => handleTouch(event.pointerType)}
        style={{ touchAction: "manipulation" }}
      >
        <Image alt={alt} className={imageClassName} fill sizes={sizes} src={src} unoptimized />
        {overlay}
        <button
          aria-label={`Expand ${alt}`}
          className="absolute right-2.5 top-2.5 z-10 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.03]"
          onClick={(event) => {
            event.stopPropagation();
            openFullView();
          }}
          onPointerUp={(event) => event.stopPropagation()}
          style={{ borderColor: "rgba(255,255,255,.28)", background: "rgba(12,10,9,.68)" }}
          type="button"
        >
          <Maximize2Icon className="size-4" />
          Full view
        </button>
      </div>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex bg-black/88 p-2 backdrop-blur-md sm:p-5"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
              role="presentation"
            >
              <section
                aria-label={`Full view of ${alt}`}
                aria-modal="true"
                className="flex min-h-0 w-full flex-col overflow-hidden rounded-xl border bg-black shadow-2xl"
                role="dialog"
                style={{ borderColor: "rgba(255,255,255,.18)" }}
              >
                <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 text-white" style={{ borderColor: "rgba(255,255,255,.14)" }}>
                  <strong className="truncate text-sm">{alt}</strong>
                  <span className="hidden text-xs font-bold text-white/60 sm:block">Tap the image or press Escape to close</span>
                  <button
                    aria-label="Close full view"
                    autoFocus
                    className="grid size-9 shrink-0 place-items-center rounded-lg border text-white"
                    onClick={() => setOpen(false)}
                    style={{ borderColor: "rgba(255,255,255,.24)", background: "rgba(255,255,255,.08)" }}
                    type="button"
                  >
                    <XIcon className="size-5" />
                  </button>
                </header>
                <button
                  aria-label="Close full view"
                  className="relative min-h-0 flex-1 cursor-zoom-out"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <Image alt={alt} className="object-contain" fill sizes="100vw" src={src} unoptimized />
                </button>
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
