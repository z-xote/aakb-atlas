export const relationshipStatuses = [
  "prospect",
  "new_lead",
  "qualified_lead",
  "client",
  "bounced",
  "archived",
] as const;

export const workflowStages = [
  "new_file",
  "before_photo",
  "image_concept",
  "proposal_needed",
  "accepted",
  "archived",
] as const;

export const projectTypes = [
  "kitchen",
  "bathroom",
  "laundry",
  "materials",
  "other",
] as const;

export const budgetRanges = [
  "unknown",
  "under_10k",
  "10k_20k",
  "20k_35k",
  "35k_50k",
  "50k_plus",
] as const;

export const jobTypes = [
  "renovation",
  "repair",
  "consult",
  "supply_only",
  "unknown",
] as const;

export const fileImageKinds = ["site_visit", "ai_generated"] as const;
export const fileAssetStatuses = ["pending", "ready", "failed"] as const;
export const fileAssetOrigins = ["camera", "upload", "generated"] as const;
export const clockPositions = ["12", "2", "3", "4", "6", "8", "9", "10"] as const;
export const atlasImageQualities = ["medium", "high"] as const;
export const atlasImageGenerationStatuses = [
  "generating",
  "complete",
  "retryable",
  "blocked",
  "failed",
  "cancelled",
] as const;

export const clockPositionHints: Record<ClockPosition, string> = {
  "12": "At the door",
  "2": "Front-right corner",
  "3": "Right of the door",
  "4": "Back-right corner",
  "6": "Opposite the door / back wall",
  "8": "Back-left corner",
  "9": "Left of the door",
  "10": "Front-left corner",
};

export const roomChoices = [
  "Kitchen",
  "Bathroom",
  "Ensuite",
  "Laundry",
  "Powder room",
  "Walk-in robe",
] as const;

export type RelationshipStatus = (typeof relationshipStatuses)[number];
export type WorkflowStage = (typeof workflowStages)[number];
export type ProjectType = (typeof projectTypes)[number];
export type BudgetRange = (typeof budgetRanges)[number];
export type JobType = (typeof jobTypes)[number];
export type FileImageKind = (typeof fileImageKinds)[number];
export type FileAssetStatus = (typeof fileAssetStatuses)[number];
export type FileAssetOrigin = (typeof fileAssetOrigins)[number];
export type ClockPosition = (typeof clockPositions)[number];
export type AtlasImageQuality = (typeof atlasImageQualities)[number];
export type AtlasImageGenerationStatus = (typeof atlasImageGenerationStatuses)[number];

export const relationshipStatusLabels: Record<RelationshipStatus, string> = {
  prospect: "Prospect",
  new_lead: "New lead",
  qualified_lead: "Qualified lead",
  client: "Client",
  bounced: "Bounced",
  archived: "Archived",
};

export const workflowStageLabels: Record<WorkflowStage, string> = {
  new_file: "New file",
  before_photo: "Before photo",
  image_concept: "Image concept",
  proposal_needed: "Proposal needed",
  accepted: "Accepted",
  archived: "Archived",
};

export const projectTypeLabels: Record<ProjectType, string> = {
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  laundry: "Laundry",
  materials: "Materials",
  other: "Other",
};

export const budgetRangeLabels: Record<BudgetRange, string> = {
  unknown: "Unknown",
  under_10k: "Under $10k",
  "10k_20k": "$10k-$20k",
  "20k_35k": "$20k-$35k",
  "35k_50k": "$35k-$50k",
  "50k_plus": "$50k+",
};

export const jobTypeLabels: Record<JobType, string> = {
  renovation: "Renovation",
  repair: "Repair",
  consult: "Consult",
  supply_only: "Supply only",
  unknown: "Unknown",
};

export const fileImageKindLabels: Record<FileImageKind, string> = {
  site_visit: "Site visit",
  ai_generated: "AI-generated",
};

export type FileFormInput = {
  title: string;
  relationshipStatus: RelationshipStatus;
  workflowStage: WorkflowStage;
  projectType: ProjectType;
  budgetRange: BudgetRange;
  jobType: JobType;
  leadSource: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  note: string;
};
