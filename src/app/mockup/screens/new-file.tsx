"use client";

import { useState } from "react";
import {
  BathIcon,
  BoxIcon,
  CameraIcon,
  CheckIcon,
  CookingPotIcon,
  LayersIcon,
  WashingMachineIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { projectTypeLabels, projectTypes, type ProjectType } from "@/types/atlas";
import type { MockupScreen } from "../types";
import { MockTopbar } from "../mock-ui";

const projectTypeIcons: Record<ProjectType, LucideIcon> = {
  kitchen: CookingPotIcon,
  bathroom: BathIcon,
  laundry: WashingMachineIcon,
  materials: LayersIcon,
  other: BoxIcon,
};

function NewFileScreen() {
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState<ProjectType | null>(null);

  const canCreate = name.trim().length > 0 && projectType !== null;

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ background: "var(--atlas-bg-root)", color: "var(--atlas-text-primary)" }}
    >
      <MockTopbar breadcrumb={["Files", "New file"]} />

      <main className="atlas-frame py-10">
        <div className="mx-auto w-full max-w-xl">
          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-head">
              <div className="flex min-w-0 flex-col">
                <h2>Start a new file</h2>
                <p className="mt-0.5 text-sm" style={{ color: "var(--atlas-text-secondary)" }}>
                  Just enough to start shooting — everything else can wait.
                </p>
              </div>
            </div>

            <div className="atlas-simple-panel-body grid gap-6">
              <div className="grid gap-2">
                <label htmlFor="client-name" className="atlas-label">
                  Client / job name
                </label>
                <input
                  id="client-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Hartley — Main Bathroom"
                  className="h-11 w-full border px-3 text-sm outline-none transition-colors"
                  style={{
                    borderColor: "var(--atlas-border-strong)",
                    borderRadius: "var(--atlas-radius)",
                    background: "var(--atlas-bg-muted)",
                    color: "var(--atlas-text-primary)",
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.borderColor = "var(--atlas-accent)";
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.borderColor = "var(--atlas-border-strong)";
                  }}
                />
              </div>

              <div className="grid gap-2">
                <span className="atlas-label">Project type</span>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {projectTypes.map((type) => {
                    const Icon = projectTypeIcons[type];
                    const active = projectType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setProjectType(type)}
                        className={cn(
                          "atlas-image-tab min-h-24 flex-col items-start justify-between gap-3",
                          active && "atlas-active"
                        )}
                      >
                        <span className="flex w-full items-center justify-between">
                          <Icon />
                          {active ? <CheckIcon className="size-4" /> : null}
                        </span>
                        <strong>{projectTypeLabels[type]}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                className="atlas-btn atlas-btn-outline h-11 px-4"
              >
                Create only
              </button>
              <button
                type="button"
                disabled={!canCreate}
                className="atlas-btn atlas-btn-primary h-11 px-4"
                style={
                  canCreate
                    ? undefined
                    : { opacity: 0.45, cursor: "not-allowed" }
                }
              >
                <CameraIcon />
                Create &amp; take first photo
              </button>
            </div>
            <p className="text-right text-xs font-bold" style={{ color: "var(--atlas-text-tertiary)" }}>
              Direction, rooms and labels are optional and editable later.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "new-file",
  title: "New file (simplified)",
  description:
    "v0.2 minimal file creation — only client name and project type before the first photo.",
  viewport: "desktop",
  Component: NewFileScreen,
};
