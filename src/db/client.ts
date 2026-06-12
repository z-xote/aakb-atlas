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
      label TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      storage_key TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
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
  `);

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
      `INSERT INTO file_assets (
        id, file_id, kind, label, url, storage_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "asset_seed_sarah_before",
        "file_seed_sarah",
        "before_photo",
        "Before photo slot",
        "",
        "files/file_seed_sarah/assets/before-photo.jpg",
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

  if (!db) {
    db = drizzle(await getSqlite(), { schema });
  }

  return db;
}
