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
