import { env } from "cloudflare:workers";
import { PDFParse } from "pdf-parse";
import { getDb } from "@/db";
import { knowledgeChunks, knowledgeSources, knowledgeState } from "@/db/schema";
import {
  projectKnowledgeIndex,
  type KnowledgeChunk,
  type KnowledgeKind,
  type KnowledgeSource,
} from "@/lib/projectKnowledge";

type PersistedKnowledgeState = {
  syncedAt: string;
  syncMode: string;
  sourceFolderLabel: string;
  provider: string;
  lastSyncMessage: string;
};

export type KnowledgeSnapshot = PersistedKnowledgeState & {
  sources: KnowledgeSource[];
  chunks: KnowledgeChunk[];
};

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
};

type DriveListedFile = DriveFile & {
  pathParts: string[];
};

const STATIC_PROVIDER = "static-file";
const DB_SEED_PROVIDER = "db-seed";
const GOOGLE_DRIVE_PROVIDER = "google-drive";

function normalizeSourceStatus(source: KnowledgeSource): KnowledgeSource {
  if (source.status) return source;
  return {
    ...source,
    status: source.indexed ? "indexed" : "unsupported",
    note:
      source.note ??
      (source.indexed
        ? "Indexed and searchable."
        : "Present in the library, but not currently indexed as searchable text."),
  };
}

function staticSnapshot(): KnowledgeSnapshot {
  return {
    syncedAt: projectKnowledgeIndex.syncedAt,
    syncMode: projectKnowledgeIndex.syncMode,
    sourceFolderLabel: projectKnowledgeIndex.sourceFolderLabel,
    provider: STATIC_PROVIDER,
    lastSyncMessage: "Using the bundled fallback project library.",
    sources: projectKnowledgeIndex.sources.map((source) => normalizeSourceStatus(source)),
    chunks: projectKnowledgeIndex.chunks,
  };
}

function hasDbBinding() {
  return Boolean((env as { DB?: D1Database }).DB);
}

function parseAliases(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function isMissingTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("no such table") || message.includes("knowledge_");
}

function canUseGoogleDriveSync() {
  const runtimeEnv = env as {
    GOOGLE_DRIVE_FOLDER_ID?: string;
    GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  };
  return Boolean(runtimeEnv.GOOGLE_DRIVE_FOLDER_ID && runtimeEnv.GOOGLE_SERVICE_ACCOUNT_JSON);
}

function formatDriveDate(value?: string) {
  return value ? value.slice(0, 10) : undefined;
}

function sanitizeId(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function detectSession(title: string) {
  const match = title.match(/meeting\s*0*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function classifyKnowledgeKind(title: string, pathParts: string[]): KnowledgeKind {
  const haystack = `${pathParts.join(" ")} ${title}`.toLowerCase();
  if (haystack.includes("summary")) return "meeting-summary";
  if (haystack.includes("transcript")) return "meeting-transcript";
  if (haystack.includes("contract")) return "contract";
  if (haystack.includes("onboarding form")) return "form-structure";
  if (haystack.includes("chatgpt strategize chat")) return "strategy-chat";
  if (haystack.includes("working plan")) return "working-plan";
  if (haystack.includes("system")) return "system";
  return "strategy-note";
}

function buildSourceRecord(file: DriveListedFile): KnowledgeSource {
  const folder = file.pathParts[0] ?? "Drive library";
  const kind = classifyKnowledgeKind(file.name, file.pathParts);
  const indexed =
    file.mimeType === "application/vnd.google-apps.document" ||
    file.mimeType === "text/plain" ||
    file.mimeType === "application/json" ||
    file.mimeType === "application/pdf";
  const status = indexed ? "indexed" : "unsupported";
  const note = indexed
    ? "Indexed and searchable."
    : `Present in the library, but ${file.mimeType} is not yet supported for indexing.`;

  return {
    id: sanitizeId(`${file.pathParts.join("-")}-${file.name}-${file.id}`),
    title: file.name,
    source: `${file.pathParts.join(" / ")} / ${file.name}`,
    folder,
    kind,
    date: formatDriveDate(file.modifiedTime),
    session: detectSession(file.name),
    indexed,
    status,
    mimeType: file.mimeType,
    note,
  };
}

function buildAliases(source: KnowledgeSource, chunkIndex: number, total: number) {
  const aliases = new Set<string>();
  if (typeof source.session === "number") {
    aliases.add(`meeting ${source.session}`);
    aliases.add(`session ${source.session}`);
    if (source.kind === "meeting-summary") aliases.add(`meeting ${source.session} summary`);
    if (source.kind === "meeting-transcript") aliases.add(`meeting ${source.session} transcript`);
  }
  if (source.kind === "meeting-summary" && chunkIndex === 0) {
    aliases.add("quick summary");
    aliases.add("meeting summary");
  }
  if (source.kind === "meeting-transcript") {
    aliases.add("meeting transcript");
  }
  if (total > 1) aliases.add(`part ${chunkIndex + 1}`);
  return [...aliases];
}

function chunkText(text: string, maxLength = 1200) {
  const paragraphs = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (!paragraphs.length) return [];

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= maxLength) {
      current = next;
      continue;
    }
    if (current) chunks.push(current);
    if (paragraph.length <= maxLength) {
      current = paragraph;
      continue;
    }
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    let sentenceChunk = "";
    for (const sentence of sentences) {
      const sentenceNext = sentenceChunk ? `${sentenceChunk} ${sentence}` : sentence;
      if (sentenceNext.length > maxLength && sentenceChunk) {
        chunks.push(sentenceChunk);
        sentenceChunk = sentence;
      } else {
        sentenceChunk = sentenceNext;
      }
    }
    current = sentenceChunk;
  }

  if (current) chunks.push(current);
  return chunks;
}

function buildChunksForSource(source: KnowledgeSource, text: string): KnowledgeChunk[] {
  const trimmed = text.trim();
  if (!trimmed || !source.indexed) return [];

  const parts = chunkText(trimmed);
  return parts.map((part, index) => ({
    id: `${source.id}-chunk-${index + 1}`,
    sourceId: source.id,
    title: parts.length === 1 ? source.title : `${source.title} - Part ${index + 1}`,
    source: source.source,
    text: part,
    kind: source.kind,
    folder: source.folder,
    session: source.session,
    date: source.date,
    aliases: buildAliases(source, index, parts.length),
  }));
}

function coreLocalSources(snapshot: KnowledgeSnapshot) {
  const localChunks = projectKnowledgeIndex.chunks.filter(
    (chunk) => chunk.kind === "strategy-note" || chunk.kind === "working-plan"
  );

  for (const chunk of localChunks) {
    const sourceId = `${chunk.id}-source`;
    if (!snapshot.sources.some((source) => source.id === sourceId)) {
      snapshot.sources.push({
        id: sourceId,
        title: chunk.title,
        source: chunk.source,
        folder: chunk.folder ?? "Local portal context",
        kind: chunk.kind,
        date: chunk.date,
        session: chunk.session,
        indexed: true,
        status: "indexed",
        note: "Portal-native context.",
      });
    }
    snapshot.chunks.push({
      ...chunk,
      sourceId,
    });
  }
}

async function readDbSnapshot() {
  const db = getDb();
  const stateRows = await db.select().from(knowledgeState).limit(1);
  const state = stateRows[0];
  if (!state) return null;

  const sources = await db.select().from(knowledgeSources);
  const chunks = await db.select().from(knowledgeChunks);

  return {
    syncedAt: state.syncedAt,
    syncMode: state.syncMode,
    sourceFolderLabel: state.sourceFolderLabel,
    provider: state.provider,
    lastSyncMessage: state.lastSyncMessage,
    sources: sources.map((source) => ({
      id: source.id,
      title: source.title,
      source: source.source,
      folder: source.folder,
      kind: source.kind as KnowledgeKind,
      date: source.date ?? undefined,
      session: source.session ?? undefined,
      indexed: source.indexed,
      status: (source.status as KnowledgeSource["status"]) ?? "indexed",
      mimeType: source.mimeType ?? undefined,
      note: source.note ?? undefined,
    })).map((source) => normalizeSourceStatus(source)),
    chunks: chunks.map((chunk) => ({
      id: chunk.id,
      sourceId: chunk.sourceId,
      title: chunk.title,
      source: chunk.source,
      text: chunk.text,
      kind: chunk.kind as KnowledgeKind,
      folder: chunk.folder ?? undefined,
      session: chunk.session ?? undefined,
      date: chunk.date ?? undefined,
      aliases: parseAliases(chunk.aliases),
    })),
  } satisfies KnowledgeSnapshot;
}

async function writeSnapshot(snapshot: KnowledgeSnapshot) {
  const db = getDb();
  await db.delete(knowledgeChunks);
  await db.delete(knowledgeSources);
  await db.delete(knowledgeState);

  if (snapshot.sources.length) {
    await db.insert(knowledgeSources).values(
      snapshot.sources.map((source) => ({
        id: source.id,
        title: source.title,
        source: source.source,
        folder: source.folder,
        kind: source.kind,
        date: source.date ?? null,
        session: source.session ?? null,
        indexed: source.indexed,
        status: source.status ?? "indexed",
        mimeType: source.mimeType ?? null,
        note: source.note ?? null,
      }))
    );
  }

  if (snapshot.chunks.length) {
    await db.insert(knowledgeChunks).values(
      snapshot.chunks.map((chunk) => ({
        id: chunk.id,
        sourceId: chunk.sourceId,
        title: chunk.title,
        source: chunk.source,
        text: chunk.text,
        kind: chunk.kind,
        folder: chunk.folder ?? null,
        session: chunk.session ?? null,
        date: chunk.date ?? null,
        aliases: JSON.stringify(chunk.aliases ?? []),
      }))
    );
  }

  await db.insert(knowledgeState).values({
    id: 1,
    syncedAt: snapshot.syncedAt,
    syncMode: snapshot.syncMode,
    sourceFolderLabel: snapshot.sourceFolderLabel,
    provider: snapshot.provider,
    lastSyncMessage: snapshot.lastSyncMessage,
  });
}

async function seedStaticSnapshot() {
  const seeded: KnowledgeSnapshot = {
    ...staticSnapshot(),
    provider: DB_SEED_PROVIDER,
    lastSyncMessage: "Seeded from the bundled project library snapshot.",
  };
  await writeSnapshot(seeded);
  return seeded;
}

function base64UrlEncode(input: string | Uint8Array) {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string) {
  const normalized = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function createGoogleAccessToken() {
  const runtimeEnv = env as {
    GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  };
  if (!runtimeEnv.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing.");
  }

  const serviceAccount = JSON.parse(runtimeEnv.GOOGLE_SERVICE_ACCOUNT_JSON) as GoogleServiceAccount;
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token",
    exp: issuedAt + 3600,
    iat: issuedAt,
  };

  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );

  const assertion = `${unsigned}.${base64UrlEncode(new Uint8Array(signature))}`;
  const response = await fetch(serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token request failed with ${response.status}.`);
  }

  const payloadJson = (await response.json()) as { access_token?: string };
  if (!payloadJson.access_token) throw new Error("Google access token missing.");
  return payloadJson.access_token;
}

async function googleDriveFetch<T>(path: string, accessToken: string, init?: RequestInit) {
  const response = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Google Drive request failed for ${path} with ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function listDriveFolder(folderId: string, accessToken: string, pathParts: string[] = []) {
  const files: DriveListedFile[] = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,modifiedTime),nextPageToken",
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
      pageSize: "1000",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await googleDriveFetch<{
      files?: DriveFile[];
      nextPageToken?: string;
    }>(`/drive/v3/files?${params.toString()}`, accessToken);

    for (const file of response.files ?? []) {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        files.push(...(await listDriveFolder(file.id, accessToken, [...pathParts, file.name])));
      } else {
        files.push({
          ...file,
          pathParts,
        });
      }
    }

    pageToken = response.nextPageToken ?? "";
  } while (pageToken);

  return files;
}

async function fetchDriveText(file: DriveListedFile, accessToken: string) {
  if (file.mimeType === "application/vnd.google-apps.document") {
    const exportPath = `/drive/v3/files/${file.id}/export?mimeType=text/plain&supportsAllDrives=true`;
    const response = await fetch(`https://www.googleapis.com${exportPath}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Google export failed for ${file.name} with ${response.status}.`);
    }
    return response.text();
  }

  if (file.mimeType === "text/plain" || file.mimeType === "application/json") {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!response.ok) {
      throw new Error(`Google media download failed for ${file.name} with ${response.status}.`);
    }
    return response.text();
  }

  if (file.mimeType === "application/pdf") {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!response.ok) {
      throw new Error(`Google PDF download failed for ${file.name} with ${response.status}.`);
    }

    const buffer = await response.arrayBuffer();
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    const extracted = result.text?.replace(/\s+\n/g, "\n").trim() ?? "";
    if (!extracted.trim()) {
      throw new Error(`PDF text extraction found no selectable text in ${file.name}.`);
    }
    return extracted;
  }

  return "";
}

function markSourceFailed(source: KnowledgeSource, error: unknown): KnowledgeSource {
  return {
    ...source,
    indexed: false,
    status: "failed",
    note: error instanceof Error ? error.message : "Sync failed while extracting text.",
  };
}

async function buildGoogleDriveSnapshot() {
  const runtimeEnv = env as {
    GOOGLE_DRIVE_FOLDER_ID?: string;
  };
  if (!runtimeEnv.GOOGLE_DRIVE_FOLDER_ID) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is missing.");
  }

  const accessToken = await createGoogleAccessToken();
  const driveFiles = await listDriveFolder(runtimeEnv.GOOGLE_DRIVE_FOLDER_ID, accessToken);
  const sources: KnowledgeSource[] = [];
  const chunks: KnowledgeChunk[] = [];

  for (const file of driveFiles) {
    const source = buildSourceRecord(file);
    if (!source.indexed) {
      sources.push(source);
      continue;
    }

    try {
      const text = await fetchDriveText(file, accessToken);
      sources.push(source);
      chunks.push(...buildChunksForSource(source, text));
    } catch (error) {
      sources.push(markSourceFailed(source, error));
    }
  }

  const snapshot: KnowledgeSnapshot = {
    syncedAt: new Date().toISOString().slice(0, 10),
    syncMode: "google-drive runtime sync + manual refresh + weekly sanity refresh",
    sourceFolderLabel: "Strategize / Chris McBreen shared Drive library",
    provider: GOOGLE_DRIVE_PROVIDER,
    lastSyncMessage: `Indexed ${chunks.length} chunks from ${sources.filter((source) => source.indexed).length} Drive docs.`,
    sources,
    chunks,
  };

  coreLocalSources(snapshot);
  return snapshot;
}

export async function syncKnowledgeLibrary() {
  if (!hasDbBinding()) return staticSnapshot();

  if (canUseGoogleDriveSync()) {
    try {
      const driveSnapshot = await buildGoogleDriveSnapshot();
      await writeSnapshot(driveSnapshot);
      return driveSnapshot;
    } catch (error) {
      const fallback = {
        ...(await seedStaticSnapshot()),
      };
      fallback.lastSyncMessage = `Drive sync failed, so the app fell back to the seeded library. ${
        error instanceof Error ? error.message : "Unknown sync error."
      }`;
      await writeSnapshot(fallback);
      return fallback;
    }
  }

  return seedStaticSnapshot();
}

export async function getKnowledgeSnapshot() {
  if (!hasDbBinding()) return staticSnapshot();

  try {
    const existing = await readDbSnapshot();
    if (existing && existing.sources.length && existing.chunks.length) {
      return existing;
    }
    return await syncKnowledgeLibrary();
  } catch (error) {
    if (isMissingTableError(error)) return staticSnapshot();
    throw error;
  }
}

export async function getKnowledgeStatus() {
  const snapshot = await getKnowledgeSnapshot();
  const indexedSources = snapshot.sources.filter((source) => (source.status ?? "indexed") === "indexed");
  const unsupportedSources = snapshot.sources.filter((source) => (source.status ?? "indexed") === "unsupported");
  const failedSources = snapshot.sources.filter((source) => (source.status ?? "indexed") === "failed");

  return {
    syncedAt: snapshot.syncedAt,
    syncMode: snapshot.syncMode,
    sourceFolderLabel: snapshot.sourceFolderLabel,
    provider: snapshot.provider,
    lastSyncMessage: snapshot.lastSyncMessage,
    indexedSourceCount: indexedSources.length,
    unsupportedSourceCount: unsupportedSources.length,
    failedSourceCount: failedSources.length,
    chunkCount: snapshot.chunks.length,
    indexedSources,
    unsupportedSources,
    failedSources,
  };
}
