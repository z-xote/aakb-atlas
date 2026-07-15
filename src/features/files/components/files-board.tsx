"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CameraIcon, LibraryBigIcon, SparklesIcon } from "lucide-react";

import {
  AddIconBox,
  AtlasPill,
  formatAtlasDate,
  relationshipBadgeTone,
  relationshipShortLabel,
  splitFileTitle,
} from "@/features/files/components/atlas-primitives";
import { DateFilter } from "@/features/files/components/date-filter";
import {
  budgetRangeLabels,
  projectTypeLabels,
  workflowStageLabels,
  type BudgetRange,
  type ProjectType,
  type RelationshipStatus,
  type WorkflowStage,
} from "@/types/atlas";

export type FilesBoardItem = {
  id: string;
  title: string;
  contactName: string | null;
  relationshipStatus: RelationshipStatus;
  workflowStage: WorkflowStage;
  projectType: ProjectType;
  budgetRange: BudgetRange;
  createdAt: number;
  imageCount: number;
  conceptCount: number;
};

function dateValue(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

export function FilesBoard({ items }: { items: FilesBoardItem[] }) {
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    const from = fromDate ? dateValue(fromDate) : null;

    return items.filter((file) => {
      const haystack = [
        file.title,
        file.contactName ?? "",
        relationshipShortLabel(file.relationshipStatus),
        workflowStageLabels[file.workflowStage],
        projectTypeLabels[file.projectType],
        budgetRangeLabels[file.budgetRange],
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!from || file.createdAt >= from) &&
        (!search || haystack.includes(search))
      );
    });
  }, [fromDate, items, query]);

  return (
    <>
      <div className="atlas-files-tools">
        <input
          aria-label="Search files"
          className="atlas-search-field"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search every file by name, project type, budget, or stage"
          value={query}
        />
        <DateFilter onChange={setFromDate} value={fromDate} />
        <Link className="atlas-catalog-button" href="/references">
          <LibraryBigIcon />
          <span><strong>Reference catalog</strong><small>Browse references</small></span>
        </Link>
      </div>

      <div className="atlas-files-grid">
        <Link className="atlas-file-tile atlas-file-tile-add" href="/files/new">
          <AddIconBox />
          <strong>Create new file</strong>
          <span className="atlas-muted">
            Add people, status, project type, and budget range.
          </span>
        </Link>

        {filteredItems.map((file) => {
          const title = splitFileTitle(file.title);

          return (
            <Link className="atlas-file-tile" href={`/files/${file.id}`} key={file.id}>
              <div className="atlas-file-tile-top">
                <div className="min-w-0">
                  <h2>{title.name}</h2>
                  <p className="atlas-muted truncate">
                    {title.subtitle || file.contactName || "No contact"}
                  </p>
                </div>
                <AtlasPill tone={relationshipBadgeTone(file.relationshipStatus)}>
                  {relationshipShortLabel(file.relationshipStatus)}
                </AtlasPill>
              </div>

              <div className="atlas-file-summary">
                <span>
                  <span className="atlas-label">Created</span>
                  <span className="atlas-value">{formatAtlasDate(file.createdAt)}</span>
                </span>
                <span>
                  <span className="atlas-label">Project type</span>
                  <span className="atlas-value">
                    {projectTypeLabels[file.projectType]}
                  </span>
                </span>
                <span>
                  <span className="atlas-label">Budget</span>
                  <span className="atlas-value">
                    {budgetRangeLabels[file.budgetRange]}
                  </span>
                </span>
                <span>
                  <span className="atlas-label">Stage</span>
                  <span className="atlas-value">
                    {workflowStageLabels[file.workflowStage]}
                  </span>
                </span>
              </div>
              <div className="mt-auto flex items-center gap-4 border-t pt-3" style={{ borderColor: "var(--atlas-border)" }}>
                <span className="inline-flex items-center gap-1 text-xs font-bold"><CameraIcon className="size-3.5" />{file.imageCount}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: file.conceptCount ? "var(--atlas-accent)" : "var(--atlas-text-tertiary)" }}><SparklesIcon className="size-3.5" />{file.conceptCount ? `${file.conceptCount} concepts` : "No concepts"}</span>
              </div>
            </Link>
          );
        })}

        {filteredItems.length === 0 ? (
          <div className="atlas-file-tile atlas-empty-tile">
            <strong>No files found</strong>
            <span className="atlas-muted">Change the search or date filter.</span>
          </div>
        ) : null}
      </div>
    </>
  );
}
