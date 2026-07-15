import fs from "node:fs";
import path from "node:path";

import { drizzle, type SQLJsDatabase } from "drizzle-orm/sql-js";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

import * as schema from "@/db/schema";
import { env } from "@/services/env";

let SQL: SqlJsStatic | null = null;
let sqlite: Database | null = null;
let db: SQLJsDatabase<typeof schema> | null = null;
let ready = false;
let loadedMtimeMs = 0;

function databasePath() {
  const filename = path.basename(env.DATABASE_PATH || "atlas.sqlite");

  return path.join(process.cwd(), "data", filename);
}

async function getSqlJs() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: () =>
        path.join(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm"),
    });
  }

  return SQL;
}

async function getSqlite() {
  if (!sqlite) {
    const SQL = await getSqlJs();
    const filePath = databasePath();

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    if (fs.existsSync(filePath)) {
      sqlite = new SQL.Database(fs.readFileSync(filePath));
      loadedMtimeMs = fs.statSync(filePath).mtimeMs;
    } else {
      sqlite = new SQL.Database();
    }

    sqlite.run("PRAGMA foreign_keys = ON");
  }

  return sqlite;
}

export async function persistDatabase() {
  if (!sqlite) {
    return;
  }

  const filePath = databasePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(sqlite.export()));
  loadedMtimeMs = fs.statSync(filePath).mtimeMs;
}

async function refreshDatabaseIfChanged() {
  if (!sqlite) return;
  const filePath = databasePath();
  if (!fs.existsSync(filePath)) return;
  const mtimeMs = fs.statSync(filePath).mtimeMs;
  if (mtimeMs <= loadedMtimeMs) return;

  const SQL = await getSqlJs();
  sqlite.close();
  sqlite = new SQL.Database(fs.readFileSync(filePath));
  sqlite.run("PRAGMA foreign_keys = ON");
  db = drizzle(sqlite, { schema });
  loadedMtimeMs = mtimeMs;
}

function ensureColumn(connection: Database, table: string, column: string, definition: string) {
  const columns = connection.exec(`PRAGMA table_info(${table})`)[0]?.values ?? [];
  if (!columns.some((row) => row[1] === column)) {
    connection.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function ensureDatabase() {
  if (ready) {
    return;
  }

  const connection = await getSqlite();

  connection.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      relationship_status TEXT NOT NULL,
      workflow_stage TEXT NOT NULL,
      project_type TEXT NOT NULL,
      budget_range TEXT NOT NULL,
      job_type TEXT NOT NULL,
      lead_source TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS primary_contacts (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS file_notes (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS file_assets (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      origin TEXT NOT NULL DEFAULT 'upload',
      label TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      storage_key TEXT NOT NULL DEFAULT '',
      content_type TEXT NOT NULL DEFAULT '',
      size_bytes INTEGER NOT NULL DEFAULT 0,
      room TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      camera_position_clock TEXT,
      captured_at INTEGER,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      pipeline_key TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      finished_at INTEGER,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS device_enrollments (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      client_instance_id TEXT NOT NULL,
      device_name TEXT NOT NULL,
      public_key TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      proof_payload TEXT NOT NULL,
      proof_verified_at INTEGER,
      status TEXT NOT NULL,
      approved_device_id TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS device_enrollments_fingerprint_idx
      ON device_enrollments(fingerprint);

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      device_name TEXT NOT NULL,
      public_key TEXT NOT NULL,
      fingerprint TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      pin_hash TEXT,
      pin_salt TEXT,
      pin_reset_required INTEGER NOT NULL DEFAULT 1,
      failed_attempt_count INTEGER NOT NULL DEFAULT 0,
      first_failed_at INTEGER,
      locked_until INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_challenges (
      id TEXT PRIMARY KEY,
      device_id TEXT,
      purpose TEXT NOT NULL,
      canonical_payload TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS auth_challenges_device_idx
      ON auth_challenges(device_id);

    CREATE TABLE IF NOT EXISTS device_sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      device_id TEXT NOT NULL,
      last_activity_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS device_sessions_device_idx
      ON device_sessions(device_id);

    CREATE TABLE IF NOT EXISTS reference_categories (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reference_images (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      label TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      storage_key TEXT NOT NULL,
      public_url TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES reference_categories(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS reference_images_category_idx
      ON reference_images(category_id);

    CREATE TABLE IF NOT EXISTS atlas_image_sessions (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      source_asset_id TEXT NOT NULL,
      parent_generation_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (source_asset_id) REFERENCES file_assets(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS atlas_image_sessions_file_idx ON atlas_image_sessions(file_id);

    CREATE TABLE IF NOT EXISTS atlas_image_directions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      body TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(session_id, position),
      FOREIGN KEY (session_id) REFERENCES atlas_image_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS atlas_image_session_references (
      session_id TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      UNIQUE(session_id, position),
      UNIQUE(session_id, reference_id),
      FOREIGN KEY (session_id) REFERENCES atlas_image_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (reference_id) REFERENCES reference_images(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS atlas_image_generations (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      session_id TEXT,
      client_request_id TEXT NOT NULL,
      attempt_of_generation_id TEXT,
      parent_generation_id TEXT,
      source_asset_id TEXT NOT NULL,
      direction_snapshot_json TEXT NOT NULL,
      compiled_prompt TEXT NOT NULL,
      reference_snapshot_json TEXT NOT NULL,
      provider_request_id TEXT,
      model TEXT NOT NULL,
      quality TEXT NOT NULL,
      status TEXT NOT NULL,
      error_code TEXT,
      error_message TEXT,
      output_asset_id TEXT,
      created_at INTEGER NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      updated_at INTEGER NOT NULL,
      UNIQUE(file_id, client_request_id),
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES atlas_image_sessions(id) ON DELETE SET NULL,
      FOREIGN KEY (source_asset_id) REFERENCES file_assets(id) ON DELETE RESTRICT,
      FOREIGN KEY (output_asset_id) REFERENCES file_assets(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS atlas_image_generations_file_idx
      ON atlas_image_generations(file_id, created_at);
  `);

  ensureColumn(connection, "file_assets", "status", "TEXT NOT NULL DEFAULT 'pending'");
  ensureColumn(connection, "file_assets", "origin", "TEXT NOT NULL DEFAULT 'upload'");
  ensureColumn(connection, "file_assets", "content_type", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(connection, "file_assets", "size_bytes", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(connection, "file_assets", "room", "TEXT");
  ensureColumn(connection, "file_assets", "tags_json", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(connection, "file_assets", "camera_position_clock", "TEXT");
  ensureColumn(connection, "file_assets", "captured_at", "INTEGER");
  ensureColumn(connection, "file_assets", "error_message", "TEXT");
  ensureColumn(connection, "file_assets", "updated_at", "INTEGER NOT NULL DEFAULT 0");
  connection.run("UPDATE file_assets SET updated_at = created_at WHERE updated_at = 0");
  connection.run("DELETE FROM file_assets WHERE id = 'asset_seed_sarah_before' AND url = ''");

  await seedDatabase(connection);
  ready = true;
}

async function seedDatabase(connection: Database) {
  const result = connection.exec("SELECT COUNT(*) as count FROM files");
  const count = Number(result[0]?.values[0]?.[0] ?? 0);

  if (count > 0) {
    return;
  }

  const now = Date.parse("2026-05-20T09:00:00.000Z");

  connection.run("BEGIN");

  try {
    connection.run(
      `INSERT INTO files (
        id, title, relationship_status, workflow_stage, project_type,
        budget_range, job_type, lead_source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "file_seed_sarah",
        "Sarah M. - Kitchen island refresh",
        "qualified_lead",
        "image_concept",
        "kitchen",
        "35k_50k",
        "renovation",
        "Site visit",
        now,
        now,
      ]
    );

    connection.run(
      `INSERT INTO primary_contacts (
        id, file_id, name, email, phone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "contact_seed_sarah",
        "file_seed_sarah",
        "Sarah Morrison",
        "sarah@example.com",
        "+64 21 555 014",
        now,
        now,
      ]
    );

    connection.run(
      "INSERT INTO file_notes (id, file_id, body, created_at) VALUES (?, ?, ?, ?)",
      [
        "note_seed_sarah",
        "file_seed_sarah",
        "Wants a lighter island concept before deciding if the full renovation is worth pursuing.",
        now,
      ]
    );

    connection.run(
      `INSERT INTO pipeline_runs (
        id, file_id, pipeline_key, status, summary, created_at, finished_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "run_seed_sarah_atlas_image",
        "file_seed_sarah",
        "atlas_image",
        "placeholder",
        "Atlas Image shell is staged. Real generation is deferred.",
        now,
        null,
      ]
    );

    connection.run("COMMIT");
    await persistDatabase();
  } catch (error) {
    connection.run("ROLLBACK");
    throw error;
  }
}

export async function getDb() {
  await ensureDatabase();
  await refreshDatabaseIfChanged();

  if (!db) {
    db = drizzle(await getSqlite(), { schema });
  }

  return db;
}
