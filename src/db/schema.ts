import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import type {
  BudgetRange,
  AtlasImageGenerationStatus,
  AtlasImageQuality,
  ClockPosition,
  FileAssetOrigin,
  FileAssetStatus,
  FileImageKind,
  JobType,
  ProjectType,
  RelationshipStatus,
  WorkflowStage,
} from "@/types/atlas";

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  relationshipStatus: text("relationship_status")
    .$type<RelationshipStatus>()
    .notNull(),
  workflowStage: text("workflow_stage").$type<WorkflowStage>().notNull(),
  projectType: text("project_type").$type<ProjectType>().notNull(),
  budgetRange: text("budget_range").$type<BudgetRange>().notNull(),
  jobType: text("job_type").$type<JobType>().notNull(),
  leadSource: text("lead_source").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const primaryContacts = sqliteTable("primary_contacts", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const fileNotes = sqliteTable("file_notes", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const fileAssets = sqliteTable("file_assets", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  kind: text("kind").$type<FileImageKind>().notNull(),
  status: text("status").$type<FileAssetStatus>().notNull().default("pending"),
  origin: text("origin").$type<FileAssetOrigin>().notNull().default("upload"),
  label: text("label").notNull(),
  url: text("url").notNull().default(""),
  storageKey: text("storage_key").notNull().default(""),
  contentType: text("content_type").notNull().default(""),
  sizeBytes: integer("size_bytes").notNull().default(0),
  room: text("room"),
  tagsJson: text("tags_json").notNull().default("[]"),
  cameraPositionClock: text("camera_position_clock").$type<ClockPosition>(),
  capturedAt: integer("captured_at"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const pipelineRuns = sqliteTable("pipeline_runs", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  pipelineKey: text("pipeline_key").notNull(),
  status: text("status").notNull(),
  summary: text("summary").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  finishedAt: integer("finished_at"),
});

export const deviceEnrollments = sqliteTable(
  "device_enrollments",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    clientInstanceId: text("client_instance_id").notNull(),
    deviceName: text("device_name").notNull(),
    publicKey: text("public_key").notNull(),
    fingerprint: text("fingerprint").notNull(),
    proofPayload: text("proof_payload").notNull(),
    proofVerifiedAt: integer("proof_verified_at"),
    status: text("status").notNull(),
    approvedDeviceId: text("approved_device_id"),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("device_enrollments_code_unique").on(table.code),
    index("device_enrollments_fingerprint_idx").on(table.fingerprint),
  ]
);

export const devices = sqliteTable(
  "devices",
  {
    id: text("id").primaryKey(),
    deviceName: text("device_name").notNull(),
    publicKey: text("public_key").notNull(),
    fingerprint: text("fingerprint").notNull(),
    status: text("status").notNull(),
    pinHash: text("pin_hash"),
    pinSalt: text("pin_salt"),
    pinResetRequired: integer("pin_reset_required", { mode: "boolean" })
      .notNull()
      .default(true),
    failedAttemptCount: integer("failed_attempt_count").notNull().default(0),
    firstFailedAt: integer("first_failed_at"),
    lockedUntil: integer("locked_until"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("devices_fingerprint_unique").on(table.fingerprint)]
);

export const authChallenges = sqliteTable(
  "auth_challenges",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id"),
    purpose: text("purpose").notNull(),
    canonicalPayload: text("canonical_payload").notNull(),
    expiresAt: integer("expires_at").notNull(),
    consumedAt: integer("consumed_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("auth_challenges_device_idx").on(table.deviceId)]
);

export const deviceSessions = sqliteTable(
  "device_sessions",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    deviceId: text("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    lastActivityAt: integer("last_activity_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    revokedAt: integer("revoked_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("device_sessions_token_hash_unique").on(table.tokenHash),
    index("device_sessions_device_idx").on(table.deviceId),
  ]
);

export const referenceCategories = sqliteTable(
  "reference_categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("reference_categories_slug_unique").on(table.slug)]
);

export const referenceImages = sqliteTable(
  "reference_images",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => referenceCategories.id, { onDelete: "restrict" }),
    label: text("label").notNull(),
    tagsJson: text("tags_json").notNull().default("[]"),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("reference_images_category_idx").on(table.categoryId)]
);

export const atlasImageSessions = sqliteTable(
  "atlas_image_sessions",
  {
    id: text("id").primaryKey(),
    fileId: text("file_id").notNull().references(() => files.id, { onDelete: "cascade" }),
    sourceAssetId: text("source_asset_id").notNull().references(() => fileAssets.id, { onDelete: "restrict" }),
    parentGenerationId: text("parent_generation_id"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("atlas_image_sessions_file_idx").on(table.fileId)]
);

export const atlasImageDirections = sqliteTable(
  "atlas_image_directions",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull().references(() => atlasImageSessions.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    position: integer("position").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("atlas_image_directions_position_unique").on(table.sessionId, table.position),
  ]
);

export const atlasImageSessionReferences = sqliteTable(
  "atlas_image_session_references",
  {
    sessionId: text("session_id").notNull().references(() => atlasImageSessions.id, { onDelete: "cascade" }),
    referenceId: text("reference_id").notNull().references(() => referenceImages.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
  },
  (table) => [
    uniqueIndex("atlas_image_session_references_position_unique").on(table.sessionId, table.position),
    uniqueIndex("atlas_image_session_references_item_unique").on(table.sessionId, table.referenceId),
  ]
);

export const atlasImageGenerations = sqliteTable(
  "atlas_image_generations",
  {
    id: text("id").primaryKey(),
    fileId: text("file_id").notNull().references(() => files.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => atlasImageSessions.id, { onDelete: "set null" }),
    clientRequestId: text("client_request_id").notNull(),
    attemptOfGenerationId: text("attempt_of_generation_id"),
    parentGenerationId: text("parent_generation_id"),
    sourceAssetId: text("source_asset_id").notNull().references(() => fileAssets.id, { onDelete: "restrict" }),
    directionSnapshotJson: text("direction_snapshot_json").notNull(),
    compiledPrompt: text("compiled_prompt").notNull(),
    referenceSnapshotJson: text("reference_snapshot_json").notNull(),
    providerRequestId: text("provider_request_id"),
    model: text("model").notNull(),
    quality: text("quality").$type<AtlasImageQuality>().notNull(),
    status: text("status").$type<AtlasImageGenerationStatus>().notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    outputAssetId: text("output_asset_id").references(() => fileAssets.id, { onDelete: "set null" }),
    createdAt: integer("created_at").notNull(),
    startedAt: integer("started_at").notNull(),
    completedAt: integer("completed_at"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("atlas_image_generations_request_unique").on(table.fileId, table.clientRequestId),
    index("atlas_image_generations_file_idx").on(table.fileId, table.createdAt),
  ]
);

export const filesRelations = relations(files, ({ many, one }) => ({
  primaryContact: one(primaryContacts, {
    fields: [files.id],
    references: [primaryContacts.fileId],
  }),
  notes: many(fileNotes),
  assets: many(fileAssets),
  pipelineRuns: many(pipelineRuns),
}));

export const primaryContactsRelations = relations(primaryContacts, ({ one }) => ({
  file: one(files, {
    fields: [primaryContacts.fileId],
    references: [files.id],
  }),
}));

export const fileNotesRelations = relations(fileNotes, ({ one }) => ({
  file: one(files, {
    fields: [fileNotes.fileId],
    references: [files.id],
  }),
}));

export const fileAssetsRelations = relations(fileAssets, ({ one }) => ({
  file: one(files, {
    fields: [fileAssets.fileId],
    references: [files.id],
  }),
}));

export const pipelineRunsRelations = relations(pipelineRuns, ({ one }) => ({
  file: one(files, {
    fields: [pipelineRuns.fileId],
    references: [files.id],
  }),
}));

export type FileRow = typeof files.$inferSelect;
export type PrimaryContactRow = typeof primaryContacts.$inferSelect;
export type FileNoteRow = typeof fileNotes.$inferSelect;
export type FileAssetRow = typeof fileAssets.$inferSelect;
export type PipelineRunRow = typeof pipelineRuns.$inferSelect;
export type DeviceEnrollmentRow = typeof deviceEnrollments.$inferSelect;
export type DeviceRow = typeof devices.$inferSelect;
export type AuthChallengeRow = typeof authChallenges.$inferSelect;
export type DeviceSessionRow = typeof deviceSessions.$inferSelect;
export type ReferenceCategoryRow = typeof referenceCategories.$inferSelect;
export type ReferenceImageRow = typeof referenceImages.$inferSelect;
export type AtlasImageSessionRow = typeof atlasImageSessions.$inferSelect;
export type AtlasImageDirectionRow = typeof atlasImageDirections.$inferSelect;
export type AtlasImageGenerationRow = typeof atlasImageGenerations.$inferSelect;
