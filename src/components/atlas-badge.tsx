import { Badge } from "@/components/ui/badge";
import type { RelationshipStatus, WorkflowStage } from "@/types/atlas";

export function RelationshipBadge({
  value,
  label,
}: {
  value: RelationshipStatus;
  label: string;
}) {
  const variant =
    value === "client" || value === "qualified_lead"
      ? "default"
      : value === "bounced" || value === "archived"
        ? "outline"
        : "secondary";

  return <Badge variant={variant}>{label}</Badge>;
}

export function WorkflowBadge({
  value,
  label,
}: {
  value: WorkflowStage;
  label: string;
}) {
  const variant = value === "accepted" ? "default" : "secondary";

  return <Badge variant={variant}>{label}</Badge>;
}
