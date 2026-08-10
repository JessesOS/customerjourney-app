import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const portalClients = sqliteTable(
  "portal_clients",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    companyName: text("company_name").notNull().default(""),
    portalToken: text("portal_token").notNull().unique(),
    startDate: text("start_date").notNull(),
    // Which ad channels this client is on: "meta" | "google" | "meta-google".
    // Drives which journey tasks they see. Existing clients default to both.
    clientType: text("client_type").notNull().default("meta-google"),
    // False when provisioning defaulted the type from a product name that
    // doesn't carry the ad-channel split (Decision 2): admin must confirm.
    clientTypeConfirmed: integer("client_type_confirmed", { mode: "boolean" }).notNull().default(true),
    // Portal look: "warm" (organic sand/terracotta, default) | "cool" (slate
    // workshop). Admin picks at creation and can change later; the client can
    // also flip it from their portal — same link either way.
    themeVariant: text("theme_variant").notNull().default("warm"),
    // Identity join to GHL (master plan §5.3). Null for hand-created clients
    // until backfilled; the unique index still allows any number of nulls.
    ghlContactId: text("ghl_contact_id"),
    ghlLocationId: text("ghl_location_id"),
    ghlOpportunityId: text("ghl_opportunity_id"),
    email: text("email"),
    phone: text("phone"),
    productCode: text("product_code"),
    sourceOrderId: text("source_order_id"),
    provisionedAt: text("provisioned_at"),
    goLiveAt: text("go_live_at"),
    // "active" | "paused" | "completed" | "cancelled" (Decision 5).
    journeyState: text("journey_state").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("portal_clients_ghl_contact_id_unique").on(table.ghlContactId)],
);

// Inbound webhook idempotency (master plan §5.3): one row per eventId ever
// received on /api/hooks/ghl/provision. A replayed eventId returns the
// original outcome instead of provisioning twice.
export const portalWebhookLog = sqliteTable("portal_webhook_log", {
  id: integer("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  receivedAt: text("received_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  // "ok" | "duplicate-contact" | "error:<reason>"
  result: text("result").notNull(),
  clientId: text("client_id"),
  payload: text("payload").notNull().default("{}"),
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
  // AI-drafted content awaiting team review. NEVER shown to the client — the
  // portal renders `content` only; an admin publishes a draft into `content`.
  draft: text("draft").notNull().default(""),
  // Provenance line for the admin, e.g. "AI draft from https://... (2026-08-10)".
  draftSource: text("draft_source").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Client-uploaded files (e.g. a CSV of past leads). With the UPLOADS R2
// binding present, the file body lives in R2 (empty `content` marks such a
// row) and this table keeps metadata; legacy rows and no-binding deploys
// store the file inline in `content`. See lib/uploadsBucket.ts.
export const portalMilestoneUploads = sqliteTable("portal_milestone_uploads", {
  id: integer("id").primaryKey(),
  clientId: text("client_id").notNull(),
  milestoneId: text("milestone_id").notNull(),
  fileName: text("file_name").notNull(),
  content: text("content").notNull(),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Real-file uploads from the guided setup form (proof of address, brand
// assets...). Bodies ALWAYS live in R2 under form-uploads/{clientId}/{fieldId}
// (no inline fallback — binary doesn't belong in D1); this table keeps the
// metadata. One row per client+field, replaced on re-upload.
export const portalFormUploads = sqliteTable("portal_form_uploads", {
  id: integer("id").primaryKey(),
  clientId: text("client_id").notNull(),
  fieldId: text("field_id").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  size: integer("size").notNull().default(0),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
