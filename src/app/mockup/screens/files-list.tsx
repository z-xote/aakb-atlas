"use client";

import { useMemo, useState } from "react";
import {
  CalendarIcon,
  CameraIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

import {
  projectTypeLabels,
  workflowStageLabels,
  type ProjectType,
} from "@/types/atlas";
import type { MockupScreen } from "../types";
import { mockFiles, type MockFile } from "../mock-data";
import { MockTopbar, StatusPill, type PillTone } from "../mock-ui";

const projectTypeTone: Record<ProjectType, PillTone> = {
  kitchen: "accent",
  bathroom: "blue",
  laundry: "amber",
  materials: "green",
  other: "muted",
};

function matchesQuery(file: MockFile, query: string): boolean {
  const haystack = [file.title, file.contactName, file.suburb]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function FileTile({ file }: { file: MockFile }) {
  const hasGenerations = file.generationCount > 0;

  return (
    <button className="atlas-file-tile text-left" type="button">
      <div className="atlas-file-tile-top">
        <div className="min-w-0">
          <h2>{file.title}</h2>
          <p className="atlas-muted truncate text-sm font-bold">
            {file.contactName} · {file.suburb}
          </p>
        </div>
        <StatusPill tone={projectTypeTone[file.projectType]}>
          {projectTypeLabels[file.projectType]}
        </StatusPill>
      </div>

      <div>
        <StatusPill tone="muted">{workflowStageLabels[file.stage]}</StatusPill>
      </div>

      <div
        className="mt-auto flex items-center justify-between gap-3 border-t pt-3"
        style={{ borderColor: "var(--atlas-border)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1 text-xs font-bold"
            style={{ color: "var(--atlas-text-secondary)" }}
          >
            <CameraIcon className="size-3.5" />
            {file.imageCount}
          </span>
          <span
            className="inline-flex items-center gap-1 text-xs font-bold"
            style={{
              color: hasGenerations
                ? "var(--atlas-accent)"
                : "var(--atlas-text-tertiary)",
            }}
          >
            <SparklesIcon className="size-3.5" />
            {hasGenerations ? `${file.generationCount} concepts` : "No concepts"}
          </span>
        </div>
        <span
          className="truncate text-[11px] font-bold"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          {file.updatedAt}
        </span>
      </div>
    </button>
  );
}

function FilesListScreen({ stateId }: { stateId: string }) {
  const [query, setQuery] = useState("");

  const search = query.trim().toLowerCase();

  const filteredFiles = useMemo(() => {
    const sourceFiles = stateId === "empty" ? [] : mockFiles;
    return sourceFiles.filter((file) => !search || matchesQuery(file, search));
  }, [stateId, search]);

  const isEmptyState = stateId === "empty";

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <MockTopbar />

      <section className="atlas-files-view">
        <div className="atlas-files-heading">
          <div className="atlas-heading">
            <div className="atlas-eyebrow">Files</div>
            <h1>Files</h1>
            <p className="atlas-subtle">
              {filteredFiles.length} {filteredFiles.length === 1 ? "file" : "files"}
              {" · "}one file is one renovation at one property.
            </p>
          </div>
        </div>

        <div className="atlas-files-tools">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
              style={{ color: "var(--atlas-text-tertiary)" }}
            />
            <input
              aria-label="Search files"
              className="atlas-search-field"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, contact, or suburb"
              style={{ paddingLeft: 36 }}
              value={query}
            />
          </div>
          <button className="atlas-date-filter-button" type="button">
            <CalendarIcon />
            <span>
              <strong>Any date</strong>
              <small>Filter by created</small>
            </span>
          </button>
        </div>

        <div className="atlas-files-grid">
          <button
            className="atlas-file-tile atlas-file-tile-add"
            type="button"
          >
            <span
              className="grid size-10 place-items-center rounded-full"
              style={{
                background: "var(--atlas-accent-soft)",
                color: "var(--atlas-accent)",
              }}
            >
              <PlusIcon className="size-5" />
            </span>
            <strong>New file</strong>
            <span className="atlas-muted text-sm font-bold">
              Name + project type, photos next.
            </span>
          </button>

          {filteredFiles.map((file) => (
            <FileTile file={file} key={file.id} />
          ))}

          {isEmptyState ? (
            <div className="atlas-file-tile atlas-empty-tile">
              <strong>No files yet</strong>
              <span className="atlas-muted text-sm font-bold">
                Create the first job to start capturing before photos.
              </span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="atlas-file-tile atlas-empty-tile">
              <strong>No files found</strong>
              <span className="atlas-muted text-sm font-bold">
                Try a different name, contact, or suburb.
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export const screen: MockupScreen = {
  id: "files-list",
  title: "Files",
  description:
    "The v0.2 Files home — searchable tile grid where each file carries an image pipeline.",
  viewport: "desktop",
  states: [
    { id: "populated", label: "Populated" },
    { id: "empty", label: "Empty" },
  ],
  Component: FilesListScreen,
};
