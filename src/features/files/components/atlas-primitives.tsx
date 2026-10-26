import { PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  RelationshipStatus,
  WorkflowStage,
} from "@/types/atlas";

export type BadgeTone = "accent" | "green" | "blue" | "amber" | "muted";

export function AtlasPill({
  tone,
  children,
  className,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  const toneClassNames: Record<BadgeTone, string> = {
    accent: "!bg-[var(--atlas-accent-soft)] !text-[var(--atlas-accent)]",
    green: "!bg-[var(--atlas-green-soft)] !text-[var(--atlas-green)]",
    blue: "!bg-[var(--atlas-blue-soft)] !text-[var(--atlas-blue)]",
    amber: "!bg-[var(--atlas-amber-soft)] !text-[var(--atlas-amber)]",
    muted: "!bg-[var(--atlas-bg-muted)] !text-[var(--atlas-text-secondary)]",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "atlas-pill",
        `atlas-pill-${tone}`,
        toneClassNames[tone],
        className
      )}
    >
      {children}
    </Badge>
  );
}

export function AtlasInfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="atlas-info-field">
      <span className="atlas-label block">{label}</span>
      <span className="atlas-value block">{value}</span>
    </div>
  );
}

export function AddIconBox() {
  return (
    <span className="atlas-pipeline-row-icon" aria-hidden="true">
      <PlusIcon />
    </span>
  );
}

export function splitFileTitle(title: string) {
  const [name, ...rest] = title.split(" - ");

  return {
    name: name || title,
    subtitle: rest.join(" - "),
  };
}

export function formatAtlasDate(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function relationshipBadgeTone(value: RelationshipStatus): BadgeTone {
  if (value === "new_lead" || value === "qualified_lead") {
    return "green";
  }

  if (value === "prospect") {
    return "accent";
  }

  return "muted";
}

export function relationshipShortLabel(value: RelationshipStatus) {
  if (value === "new_lead" || value === "qualified_lead") {
    return "Lead";
  }

  if (value === "client") {
    return "Client";
  }

  if (value === "bounced") {
    return "Bounced";
  }

  if (value === "archived") {
    return "Archived";
  }

  return "Prospect";
}

export function workflowReadyLabel(value: WorkflowStage) {
  if (value === "design_concept") {
    return "Design concept ready";
  }

  if (value === "site_visit") {
    return "Site visit needed";
  }

  if (value === "accepted") {
    return "Accepted";
  }

  if (value === "proposal") {
    return "Proposal needed";
  }

  if (value === "archived") {
    return "Archived";
  }

  return "File setup";
}
