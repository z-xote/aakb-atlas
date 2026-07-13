"use client";

import { useMemo, useState } from "react";
import { SearchIcon, TerminalIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MockupScreen } from "../types";
import {
  mockReferences,
  referenceCategories,
  type MockReference,
} from "../mock-data";
import { MockImage, MockTopbar, StatusPill, TagChip } from "../mock-ui";

const categoryLabel = (slug: string): string =>
  referenceCategories.find((category) => category.slug === slug)?.label ?? slug;

function matchesQuery(reference: MockReference, query: string): boolean {
  const haystack = [reference.label, ...reference.tags].join(" ").toLowerCase();
  return haystack.includes(query);
}

function ReferenceCard({ reference }: { reference: MockReference }) {
  return (
    <article
      className="group overflow-hidden border transition-all"
      style={{
        borderColor: "var(--atlas-border)",
        borderRadius: "var(--atlas-radius)",
        background: "var(--atlas-bg-surface)",
      }}
    >
      <MockImage seed={reference.seed} ratio="4 / 3" />
      <div className="flex flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="min-w-0 truncate text-sm font-bold"
            style={{ color: "var(--atlas-text-primary)" }}
          >
            {reference.label}
          </h3>
          <StatusPill tone="accent">{categoryLabel(reference.category)}</StatusPill>
        </div>

        {reference.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {reference.tags.map((tag) => (
              <TagChip key={tag}>{tag}</TagChip>
            ))}
          </div>
        ) : null}

        <p
          className="mt-0.5 text-[11px] font-bold"
          style={{ color: "var(--atlas-text-tertiary)" }}
        >
          added by {reference.addedBy} · {reference.addedAt}
        </p>
      </div>
    </article>
  );
}

function ReferenceCatalogScreen({ stateId }: { stateId: string }) {
  const [query, setQuery] = useState(stateId === "search" ? "oak" : "");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const search = query.trim().toLowerCase();

  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const reference of mockReferences) {
      counts.set(reference.category, (counts.get(reference.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  const filtered = useMemo(
    () =>
      mockReferences.filter((reference) => {
        if (activeCategory !== "all" && reference.category !== activeCategory) {
          return false;
        }
        return !search || matchesQuery(reference, search);
      }),
    [activeCategory, search]
  );

  const isSearching = search.length > 0;
  const activeCategoryIsEmpty =
    activeCategory !== "all" &&
    (countsByCategory.get(activeCategory) ?? 0) === 0;

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{
        background: "var(--atlas-bg-root)",
        color: "var(--atlas-text-primary)",
      }}
    >
      <MockTopbar breadcrumb={["Reference catalog"]} />

      <section className="atlas-files-view">
        {/* Header */}
        <div className="atlas-files-heading">
          <div className="atlas-heading">
            <div className="atlas-eyebrow">Company library</div>
            <h1>Reference catalog</h1>
            <p className="atlas-subtle">
              {mockReferences.length} references · {referenceCategories.length}{" "}
              categories · curated generation inputs, shared across every file.
            </p>
          </div>
        </div>

        {/* Agent-managed notice */}
        <div
          className="mb-5 flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: "var(--atlas-border)",
            borderRadius: "var(--atlas-radius)",
            background: "var(--atlas-bg-muted)",
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center"
              style={{
                borderRadius: "var(--atlas-radius)",
                background: "var(--atlas-accent-soft)",
                color: "var(--atlas-accent)",
              }}
            >
              <TerminalIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <p
                className="text-sm font-bold"
                style={{ color: "var(--atlas-text-primary)" }}
              >
                Managed by the AI agent
              </p>
              <p
                className="mt-0.5 text-sm"
                style={{ color: "var(--atlas-text-secondary)" }}
              >
                Browse and search here — ask the agent to add or reshuffle
                references.
              </p>
            </div>
          </div>
          <code
            className="shrink-0 truncate rounded px-3 py-2 font-mono text-xs"
            style={{
              background: "var(--atlas-bg-surface)",
              border: "1px solid var(--atlas-border)",
              color: "var(--atlas-text-tertiary)",
            }}
          >
            atlas refs add vanities ./photo.jpg --tags &quot;oak, wall-hung&quot;
          </code>
        </div>

        {/* Toolbar: search + category pills */}
        <div className="mb-5 flex flex-col gap-4">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
              style={{ color: "var(--atlas-text-tertiary)" }}
            />
            <input
              aria-label="Search references"
              className="atlas-search-field"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search references by label or tag"
              style={{ paddingLeft: 36, paddingRight: 40 }}
              value={query}
            />
            {isSearching ? (
              <button
                aria-label="Clear search"
                className="atlas-icon-button absolute right-1.5 top-1/2 -translate-y-1/2"
                onClick={() => setQuery("")}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <CategoryPill
              active={activeCategory === "all"}
              label="All"
              count={mockReferences.length}
              onClick={() => setActiveCategory("all")}
            />
            {referenceCategories.map((category) => (
              <CategoryPill
                key={category.slug}
                active={activeCategory === category.slug}
                label={category.label}
                count={countsByCategory.get(category.slug) ?? 0}
                onClick={() => setActiveCategory(category.slug)}
              />
            ))}
          </div>
        </div>

        {/* Results line */}
        {isSearching ? (
          <p
            className="mb-4 text-sm font-bold"
            style={{ color: "var(--atlas-text-secondary)" }}
          >
            {filtered.length} {filtered.length === 1 ? "match" : "matches"} for
            &ldquo;{query.trim()}&rdquo;
          </p>
        ) : null}

        {/* Grid / empty states */}
        {activeCategoryIsEmpty ? (
          <div
            className="grid min-h-40 place-items-center gap-1 border border-dashed p-8 text-center"
            style={{
              borderColor: "var(--atlas-border-strong)",
              borderRadius: "var(--atlas-radius)",
            }}
          >
            <strong
              className="text-sm font-bold"
              style={{ color: "var(--atlas-text-primary)" }}
            >
              Nothing in {categoryLabel(activeCategory)} yet
            </strong>
            <span
              className="text-sm"
              style={{ color: "var(--atlas-text-secondary)" }}
            >
              The agent can add some — this category exists and is ready for
              references.
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="grid min-h-40 place-items-center gap-1 border border-dashed p-8 text-center"
            style={{
              borderColor: "var(--atlas-border-strong)",
              borderRadius: "var(--atlas-radius)",
            }}
          >
            <strong
              className="text-sm font-bold"
              style={{ color: "var(--atlas-text-primary)" }}
            >
              No references found
            </strong>
            <span
              className="text-sm"
              style={{ color: "var(--atlas-text-secondary)" }}
            >
              Try a different label, tag, or category.
            </span>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
          >
            {filtered.map((reference) => (
              <ReferenceCard key={reference.id} reference={reference} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  const isEmpty = count === 0;
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors"
      )}
      onClick={onClick}
      style={{
        borderColor: active ? "var(--atlas-accent)" : "var(--atlas-border)",
        background: active ? "var(--atlas-accent)" : "var(--atlas-bg-surface)",
        color: active
          ? "#ffffff"
          : isEmpty
            ? "var(--atlas-text-tertiary)"
            : "var(--atlas-text-secondary)",
      }}
      type="button"
    >
      {label}
      <span
        className="text-[11px] font-bold"
        style={{
          color: active ? "rgba(255,255,255,0.75)" : "var(--atlas-text-tertiary)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

export const screen: MockupScreen = {
  id: "reference-catalog",
  title: "Reference catalog (browse only)",
  description:
    "Company-wide curated generation inputs — browse/search only; the AI agent adds references via the CLI.",
  viewport: "desktop",
  states: [
    { id: "browse", label: "Browsing" },
    { id: "search", label: "Search results" },
  ],
  Component: ReferenceCatalogScreen,
};
