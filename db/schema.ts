import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
    // When the client first and last opened their portal link (Jesse,
    // 2026-10-16). Recorded by the page itself, so link previews don't count,
    // and skipped in a browser signed in to admin.
    firstOpenedAt: text("first_opened_at"),
    lastOpenedAt: text("last_opened_at"),
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

// ---- Team back office (Option D, 2026-10-17) ----
// The team's task board lives in this app (it replaces the CSM dashboard).
// Additive tables only: nothing here changes what a client's portal reads.
// Team tasks are COPIED from a product file (products/) when a client's board
// starts, stamped with the product version, so later edits to a product file
// never change an existing client's board.

/** People who can sign in to the back office (Cloudflare Access email). */
export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey(),
  email: text("email").notNull().unique(), // stored lowercase
  name: text("name").notNull(),
  roles: text("roles").notNull().default("[]"), // JSON string[]: product roles they cover
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastSeenAt: text("last_seen_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** One per client whose team board has been started. */
export const teamBoards = sqliteTable("team_boards", {
  clientId: text("client_id").primaryKey(),
  productId: text("product_id").notNull(),
  productVersion: text("product_version").notNull(),
  variant: text("variant").notNull(),
  startedAt: text("started_at").notNull(),
  startedBy: text("started_by").notNull(),
});

/** A team task on one client's board. */
export const teamTasks = sqliteTable(
  "team_tasks",
  {
    id: integer("id").primaryKey(),
    clientId: text("client_id").notNull(),
    templateId: text("template_id").notNull(), // scl-018, or custom-xxxxxxxx
    productVersion: text("product_version").notNull(),
    isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    stageId: text("stage_id").notNull(),
    category: text("category").notNull().default(""),
    stepId: text("step_id"), // client step it sits behind; null = team-only
    completesWithSteps: text("completes_with_steps").notNull().default("[]"), // JSON string[]
    role: text("role").notNull().default(""),
    assigneeEmail: text("assignee_email"),
    status: text("status").notNull().default("queued"), // queued | in_progress | complete
    blockedReason: text("blocked_reason").notNull().default(""),
    priority: text("priority").notNull().default("normal"), // low | normal | high | critical
    dueWindow: text("due_window").notNull().default(""),
    dueDayStart: integer("due_day_start"),
    dueDayEnd: integer("due_day_end"),
    dependencies: text("dependencies").notNull().default("[]"), // JSON template ids
    loomUrl: text("loom_url").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    statusChangedAt: text("status_changed_at"),
    completedAt: text("completed_at"),
    completedBy: text("completed_by"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("team_tasks_client_template_unique").on(table.clientId, table.templateId),
    index("team_tasks_assignee_idx").on(table.assigneeEmail),
  ],
);

/** Who did what on a board. Comments are events too. */
export const teamTaskEvents = sqliteTable(
  "team_task_events",
  {
    id: integer("id").primaryKey(),
    clientId: text("client_id").notNull(),
    taskId: integer("task_id"), // null = board-level (board started)
    actorEmail: text("actor_email").notNull(),
    actorName: text("actor_name").notNull(),
    kind: text("kind").notNull(), // seed | status | assign | blocked | notes | loom | priority | due | comment | create | delete
    fromValue: text("from_value"),
    toValue: text("to_value"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("team_task_events_client_idx").on(table.clientId, table.createdAt), index("team_task_events_task_idx").on(table.taskId)],
);

// ---- Portal assistant ("Ask Jesse", 2026-10-18). Additive; nothing above changes. ----

/** The reviewed knowledge pack the assistant answers from: one per client, loaded by scripts/assistant-pack.mjs. */
export const portalAssistantPacks = sqliteTable("portal_assistant_packs", {
  clientId: text("client_id").primaryKey(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: text("updated_by").notNull().default(""),
});

/** The client's side panel: their questions, the assistant's answers, and the team's replies to their requests. */
export const portalMessages = sqliteTable(
  "portal_messages",
  {
    id: integer("id").primaryKey(),
    clientId: text("client_id").notNull(),
    role: text("role").notNull(), // client | assistant | team
    body: text("body").notNull(),
    /** The board task a support request created, on the request and on each team reply to it. */
    requestTaskId: integer("request_task_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("portal_messages_client_idx").on(table.clientId, table.createdAt), index("portal_messages_request_idx").on(table.requestTaskId)],
);
