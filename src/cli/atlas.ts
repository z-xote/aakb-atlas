#!/usr/bin/env bun

import { readFile } from "node:fs/promises";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string; details?: unknown } };

const rawArgs = process.argv.slice(2);
const jsonMode = rawArgs.includes("--json");
const args = rawArgs.filter((value) => value !== "--json");
const baseUrl = (process.env.ATLAS_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const token = process.env.ATLAS_CLI_ADMIN_TOKEN;

function fail(message: string, code = 2, details?: unknown): never {
  if (jsonMode) console.error(JSON.stringify({ ok: false, error: { message, details } }));
  else console.error(`atlas: ${message}`);
  process.exit(code);
}

function option(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function imageContentType(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  return ({
    avif: "image/avif",
    gif: "image/gif",
    ico: "image/x-icon",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  } as Record<string, string>)[extension ?? ""] ?? "application/octet-stream";
}

async function imageBlob(filename: string) {
  let fileBytes: Uint8Array;
  try {
    fileBytes = new Uint8Array(await readFile(filename));
  } catch {
    fail(`file not found: ${filename}`, 3);
  }
  const fileBuffer = fileBytes.buffer.slice(
    fileBytes.byteOffset,
    fileBytes.byteOffset + fileBytes.byteLength
  ) as ArrayBuffer;
  return new Blob([fileBuffer], { type: imageContentType(filename) });
}

async function request<T>(path: string, init?: RequestInit) {
  if (!token) fail("ATLAS_CLI_ADMIN_TOKEN is not set.", 2);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { authorization: `Bearer ${token}`, ...init?.headers },
    });
  } catch (error) {
    fail(`could not reach Atlas at ${baseUrl}`, 6, error instanceof Error ? error.message : error);
  }
  const body = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!body.ok) {
    const exitCode = response.status === 401 ? 4 : response.status === 404 ? 5 : response.status < 500 ? 3 : 6;
    fail(`${body.error.code}: ${body.error.message}`, exitCode, body.error.details);
  }
  return body.data;
}

function print(data: unknown, compact: () => void) {
  if (jsonMode) console.log(JSON.stringify(data));
  else compact();
}

async function devicesCommand() {
  const action = args[1];
  if (action === "list") {
    const rows = await request<Array<{ id: string; name: string; fingerprint: string; status: string; pinResetRequired: boolean }>>("/api/admin/devices");
    print(rows, () => rows.forEach((row) => console.log(`${row.id}\t${row.status}\t${row.name}\t${row.fingerprint.slice(-16)}${row.pinResetRequired ? "\tPIN RESET" : ""}`)));
    return;
  }
  const value = args[2];
  if (!value) fail(`devices ${action ?? "<action>"} requires a code or device ID.`, 3);
  if (action === "approve") {
    const row = await request<{ deviceId: string; deviceName: string; fingerprint: string }>(`/api/admin/device-enrollments/${encodeURIComponent(value)}/approve`, { method: "POST" });
    print(row, () => console.log(`Approved ${row.deviceName} (${row.deviceId})\nFingerprint ${row.fingerprint}`));
    return;
  }
  if (action === "reset-pin" || action === "revoke") {
    const row = await request<Record<string, unknown>>(`/api/admin/devices/${encodeURIComponent(value)}/${action}`, { method: "POST" });
    print(row, () => console.log(action === "reset-pin" ? `PIN reset requested for ${value}; active sessions revoked.` : `Revoked ${value}; sessions and challenges invalidated.`));
    return;
  }
  fail("Use: atlas devices list|approve|reset-pin|revoke", 3);
}

async function referenceCategoriesCommand() {
  const action = args[2];
  if (action === "list") {
    const rows = await request<Array<{ id: string; slug: string; label: string; sortOrder: number }>>("/api/admin/references/categories");
    print(rows, () => rows.forEach((row) => console.log(`${row.slug}\t${row.label}\t${row.sortOrder}`)));
    return;
  }
  if (action === "create") {
    const slug = args[3]?.startsWith("--") ? undefined : args[3];
    const label = option("--label");
    if (!label) fail("Use: atlas references categories create [<slug>] --label <label> [--sort <number>]", 3);
    const sort = option("--sort");
    const row = await request<{ slug: string; label: string }>("/api/admin/references/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, label, sortOrder: sort === undefined ? undefined : Number(sort) }),
    });
    print(row, () => console.log(`Created reference category ${row.slug} (${row.label}).`));
    return;
  }
  if (action === "rename") {
    const slug = args[3];
    const label = option("--label");
    if (!slug || slug.startsWith("--") || !label) fail("Use: atlas references categories rename <slug> --label <label>", 3);
    const row = await request<{ slug: string; label: string }>(`/api/admin/references/categories/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label }),
    });
    print(row, () => console.log(`Renamed ${slug} to ${row.label} (${row.slug}).`));
    return;
  }
  fail("Use: atlas references categories list|create|rename", 3);
}

async function referencesCommand() {
  if (args[1] === "categories") return referenceCategoriesCommand();
  const action = args[1];
  if (action === "list" || action === "search") {
    const query = action === "search" ? args[2] : undefined;
    if (action === "search" && !query) fail("references search requires a query.", 3);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (option("--category")) params.set("category", option("--category")!);
    const rows = await request<Array<{ id: string; label: string; categorySlug: string; tags: string[]; url: string }>>(`/api/admin/references?${params}`);
    print(rows, () => rows.forEach((row) => console.log(`${row.id}\t${row.categorySlug}\t${row.label}\t${row.tags.join(",")}`)));
    return;
  }
  if (action === "get") {
    const id = args[2];
    if (!id) fail("references get requires an ID.", 3);
    const row = await request<{ id: string; label: string; categorySlug: string; tags: string[]; url: string }>(`/api/admin/references/${encodeURIComponent(id)}`);
    print(row, () => console.log(`${row.id}\n${row.label}\nCategory: ${row.categorySlug}\nTags: ${row.tags.join(", ")}\nURL: ${row.url}`));
    return;
  }
  if (action === "delete") {
    const id = args[2];
    if (!id) fail("references delete requires an ID.", 3);
    const row = await request<{ id: string; label: string; storageRemoved: boolean; categoryRemoved: boolean }>(`/api/admin/references/${encodeURIComponent(id)}`, { method: "DELETE" });
    print(row, () => console.log(`Deleted ${row.label} (${row.id}).${row.categoryRemoved ? "\nIts category had no references left and was removed." : ""}${row.storageRemoved ? "" : "\nThe stored image could not be removed; check the server log."}`));
    return;
  }
  if (action === "edit") {
    const id = args[2];
    const image = option("--image");
    const fields = (["--label", "--category", "--tags"] as const).filter((name) => option(name) !== undefined);
    if (!id || (!fields.length && !image)) fail("Use: atlas references edit <id> [--label <label>] [--category <slug>] [--tags a,b] [--image <file>]", 3);
    const form = new FormData();
    for (const name of fields) form.set(name.slice(2), option(name)!);
    if (image) form.set("image", await imageBlob(image), image.split(/[\\/]/).pop());
    const row = await request<{ id: string; label: string; categorySlug: string; tags: string[]; url: string; categoryRemoved: boolean }>(`/api/admin/references/${encodeURIComponent(id)}`, { method: "PATCH", body: form });
    print(row, () => console.log(`Updated ${row.label} (${row.id}) in ${row.categorySlug}.\nTags: ${row.tags.join(", ")}\n${row.url}${row.categoryRemoved ? "\nThe old category had no references left and was removed." : ""}`));
    return;
  }
  if (action === "upload") {
    const filename = args[2];
    const category = option("--category");
    const label = option("--label");
    if (!filename || !category || !label) fail("Use: atlas references upload <file> --category <slug> --label <label> [--tags a,b]", 3);
    const form = new FormData();
    form.set("category", category);
    form.set("label", label);
    form.set("tags", option("--tags") ?? "");
    form.set("image", await imageBlob(filename), filename.split(/[\\/]/).pop());
    const row = await request<{ id: string; label: string; categorySlug: string; url: string }>("/api/admin/references/upload", { method: "POST", body: form });
    print(row, () => console.log(`Uploaded ${row.label} (${row.id}) to ${row.categorySlug}.\n${row.url}`));
    return;
  }
  fail("Use: atlas references list|search|get|upload|edit|delete|categories", 3);
}

async function main() {
  if (args[0] === "devices") return devicesCommand();
  if (args[0] === "references") return referencesCommand();
  fail("Use: atlas devices ... | atlas references ...", 3);
}

await main();
