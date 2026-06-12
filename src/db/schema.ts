import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type {
  BudgetRange,
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
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull().default(""),
  storageKey: text("storage_key").notNull().default(""),
  createdAt: integer("created_at").notNull(),
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
