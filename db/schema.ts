import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const knowledgeState = sqliteTable("knowledge_state", {
  id: integer("id").primaryKey(),
  syncedAt: text("synced_at").notNull(),
  syncMode: text("sync_mode").notNull(),
  sourceFolderLabel: text("source_folder_label").notNull(),
  provider: text("provider").notNull(),
  lastSyncMessage: text("last_sync_message").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const knowledgeSources = sqliteTable("knowledge_sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  folder: text("folder").notNull(),
  kind: text("kind").notNull(),
  date: text("date"),
  session: integer("session"),
  indexed: integer("indexed", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("indexed"),
  mimeType: text("mime_type"),
  note: text("note"),
});

export const knowledgeChunks = sqliteTable("knowledge_chunks", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  text: text("text").notNull(),
  kind: text("kind").notNull(),
  folder: text("folder"),
  session: integer("session"),
  date: text("date"),
  aliases: text("aliases").notNull().default("[]"),
});

export const liveDashboardSnapshot = sqliteTable("live_dashboard_snapshot", {
  id: integer("id").primaryKey(),
  syncedAt: text("synced_at").notNull(),
  provider: text("provider").notNull(),
  sourceClientId: text("source_client_id").notNull(),
  lastSyncMessage: text("last_sync_message").notNull().default(""),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const liveDashboardOverrideState = sqliteTable("live_dashboard_override_state", {
  id: integer("id").primaryKey(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  payload: text("payload").notNull(),
});

export const portalClients = sqliteTable("portal_clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name").notNull().default(""),
  portalToken: text("portal_token").notNull().unique(),
  startDate: text("start_date").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const portalMilestoneProgress = sqliteTable("portal_milestone_progress", {
  id: integer("id").primaryKey(),
  clientId: text("client_id").notNull(),
  milestoneId: text("milestone_id").notNull(),
  completedAt: text("completed_at"),
  note: text("note"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const portalFormResponses = sqliteTable("portal_form_responses", {
  id: integer("id").primaryKey(),
  clientId: text("client_id").notNull(),
  formId: text("form_id").notNull(),
  responses: text("responses").notNull().default("{}"),
  completedAt: text("completed_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Team-authored content that's specific to one client (e.g. their drafted AI
// qualification questions), set by an admin and shown read-only in the portal.
export const portalMilestoneContent = sqliteTable("portal_milestone_content", {
  id: integer("id").primaryKey(),
  clientId: text("client_id").notNull(),
  milestoneId: text("milestone_id").notNull(),
  content: text("content").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Client-uploaded files (e.g. a CSV of past leads). Stored inline as text --
// there's no R2 bucket provisioned for this app, and these files are small.
export const portalMilestoneUploads = sqliteTable("portal_milestone_uploads", {
  id: integer("id").primaryKey(),
  clientId: text("client_id").notNull(),
  milestoneId: text("milestone_id").notNull(),
  fileName: text("file_name").notNull(),
  content: text("content").notNull(),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
