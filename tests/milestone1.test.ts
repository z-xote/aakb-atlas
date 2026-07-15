import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import * as openpgp from "openpgp";

const databaseName = `atlas-milestone1-${randomUUID()}.sqlite`;
process.env.DATABASE_PATH = `data/${databaseName}`;
process.env.ATLAS_CLI_ADMIN_TOKEN = "test-cli-admin-token";
process.env.ATLAS_STORAGE_DRIVER = "local";

const auth = await import("@/services/auth/device");
const admin = await import("@/services/auth/admin");
const dbModule = await import("@/db/client");
const schema = await import("@/db/schema");
const filesData = await import("@/features/files/data");
const { fileFormSchema } = await import("@/features/files/schemas");
const references = await import("@/features/references/data");

let privateKey: openpgp.PrivateKey;
let publicKey = "";
let enrollmentId = "";
let deviceId = "";
let currentPin = "2468";
const uploadedFiles: string[] = [];

async function sign(payload: string, key = privateKey) {
  return openpgp.sign({
    message: await openpgp.createMessage({ text: payload }),
    signingKeys: key,
    detached: true,
    format: "armored",
  });
}

beforeAll(async () => {
  const generated = await openpgp.generateKey({
    type: "ecc",
    curve: "ed25519Legacy",
    userIDs: [{ name: "Milestone test device" }],
    format: "armored",
  });
  publicKey = generated.publicKey;
  privateKey = await openpgp.readPrivateKey({ armoredKey: generated.privateKey });
});

afterAll(async () => {
  await rm(path.join(process.cwd(), "data", databaseName), { force: true });
  await Promise.all(uploadedFiles.map((filename) => rm(filename, { force: true })));
});

describe("Milestone 1 device authentication", () => {
  test("enrollment requires valid possession proof and can be approved", async () => {
    const enrollment = await auth.createEnrollment({
      deviceName: "Milestone test device",
      clientInstanceId: "test-browser-instance",
      publicKey,
      origin: "http://localhost:3000",
    });
    enrollmentId = enrollment.enrollmentId;
    await expect(auth.proveEnrollment(enrollmentId, "not-a-signature")).rejects.toMatchObject({ code: "invalid_key_proof" });
    await expect(auth.proveEnrollment(enrollmentId, await sign(enrollment.proofChallenge))).resolves.toEqual({ verified: true });
    const approved = await auth.approveEnrollment(enrollment.code);
    deviceId = approved.deviceId;
    expect(approved.fingerprint).toHaveLength(40);
  });

  test("expired enrollments cannot be proved", async () => {
    const generated = await openpgp.generateKey({
      type: "ecc",
      curve: "ed25519Legacy",
      userIDs: [{ name: "Expired device" }],
      format: "armored",
    });
    const enrollment = await auth.createEnrollment({
      deviceName: "Expired device",
      clientInstanceId: "expired-instance",
      publicKey: generated.publicKey,
      origin: "http://localhost:3000",
    });
    const db = await dbModule.getDb();
    db.update(schema.deviceEnrollments)
      .set({ expiresAt: Date.now() - 1 })
      .where((await import("drizzle-orm")).eq(schema.deviceEnrollments.id, enrollment.enrollmentId))
      .run();
    await dbModule.persistDatabase();
    await expect(auth.proveEnrollment(enrollment.enrollmentId, "unused")).rejects.toMatchObject({ code: "enrollment_expired" });
  });

  test("challenge is one-use and initial PIN is scrypt-protected", async () => {
    const challenge = await auth.issueChallenge({ deviceId, purpose: "pin_set", origin: "http://localhost:3000" });
    const input = { enrollmentId, challengeId: challenge.challengeId, signature: await sign(challenge.payload), pin: currentPin, confirmPin: currentPin };
    const session = await auth.setDevicePin(input);
    expect(await auth.findActiveSession(session.token)).not.toBeNull();
    await expect(auth.setDevicePin(input)).rejects.toMatchObject({ code: "invalid_challenge" });
    const db = await dbModule.getDb();
    const device = db.select().from(schema.devices).where((await import("drizzle-orm")).eq(schema.devices.id, deviceId)).get();
    expect(device?.pinHash).not.toBe(currentPin);
    expect(device?.pinSalt).toBeTruthy();
  });

  test("five wrong PINs rate-limit the device with remaining-attempt feedback", async () => {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const challenge = await auth.issueChallenge({ deviceId, purpose: "unlock", origin: "http://localhost:3000" });
      const promise = auth.verifyDeviceUnlock({
        challengeId: challenge.challengeId,
        signature: await sign(challenge.payload),
        pin: "0000",
      });
      if (attempt < 5) {
        await expect(promise).rejects.toMatchObject({ code: "invalid_pin", details: { remainingAttempts: 5 - attempt } });
      } else {
        await expect(promise).rejects.toMatchObject({ code: "device_locked", details: { remainingAttempts: 0 } });
      }
    }
    const db = await dbModule.getDb();
    const { eq } = await import("drizzle-orm");
    db.update(schema.devices)
      .set({ failedAttemptCount: 0, firstFailedAt: null, lockedUntil: null })
      .where(eq(schema.devices.id, deviceId))
      .run();
    await dbModule.persistDatabase();
  });

  test("sessions become invalid after fifteen minutes without activity", async () => {
    const challenge = await auth.issueChallenge({ deviceId, purpose: "unlock", origin: "http://localhost:3000" });
    const session = await auth.verifyDeviceUnlock({
      challengeId: challenge.challengeId,
      signature: await sign(challenge.payload),
      pin: currentPin,
    });
    const db = await dbModule.getDb();
    const { eq } = await import("drizzle-orm");
    db.update(schema.deviceSessions)
      .set({ lastActivityAt: Date.now() - auth.SESSION_IDLE_MS - 1 })
      .where(eq(schema.deviceSessions.tokenHash, (await import("node:crypto")).createHash("sha256").update(session.token).digest("hex")))
      .run();
    await dbModule.persistDatabase();
    expect(await auth.findActiveSession(session.token)).toBeNull();
  });

  test("PIN reset and revoke invalidate sessions", async () => {
    let challenge = await auth.issueChallenge({ deviceId, purpose: "unlock", origin: "http://localhost:3000" });
    const first = await auth.verifyDeviceUnlock({ challengeId: challenge.challengeId, signature: await sign(challenge.payload), pin: currentPin });
    expect(await auth.findActiveSession(first.token)).not.toBeNull();
    await auth.resetDevicePin(deviceId);
    expect(await auth.findActiveSession(first.token)).toBeNull();

    currentPin = "1357";
    challenge = await auth.issueChallenge({ deviceId, purpose: "pin_set", origin: "http://localhost:3000" });
    await auth.setDevicePin({ enrollmentId, challengeId: challenge.challengeId, signature: await sign(challenge.payload), pin: currentPin, confirmPin: currentPin });
    challenge = await auth.issueChallenge({ deviceId, purpose: "unlock", origin: "http://localhost:3000" });
    const second = await auth.verifyDeviceUnlock({ challengeId: challenge.challengeId, signature: await sign(challenge.payload), pin: currentPin });
    await auth.revokeDevice(deviceId);
    expect(await auth.findActiveSession(second.token)).toBeNull();
  });
});

describe("Milestone 1 file, CLI, and reference contracts", () => {
  test("wizard validation rejects missing required fields and persists every field", async () => {
    expect(fileFormSchema.safeParse({}).success).toBe(false);
    const input = {
      title: "Test kitchen refresh",
      relationshipStatus: "qualified_lead" as const,
      workflowStage: "new_file" as const,
      projectType: "kitchen" as const,
      budgetRange: "20k_35k" as const,
      jobType: "renovation" as const,
      leadSource: "Referral",
      contactName: "Test Client",
      contactEmail: "client@example.com",
      contactPhone: "+64 21 555 0100",
      note: "Keep this note.",
    };
    expect(fileFormSchema.safeParse(input).success).toBe(true);
    const id = await filesData.createFile(input);
    const detail = await filesData.getFileDetail(id);
    expect(detail?.file).toMatchObject({ title: input.title, leadSource: input.leadSource, budgetRange: input.budgetRange });
    expect(detail?.contact).toMatchObject({ name: input.contactName, email: input.contactEmail, phone: input.contactPhone });
    expect(detail?.notes[0]?.body).toBe(input.note);
    expect(detail?.assets).toHaveLength(0);
  });

  test("CLI admin bearer authorization accepts only the configured token", () => {
    expect(() => admin.requireCliAdmin(new Request("http://localhost/api", { headers: { authorization: "Bearer wrong" } }))).toThrow();
    expect(() => admin.requireCliAdmin(new Request("http://localhost/api", { headers: { authorization: "Bearer test-cli-admin-token" } }))).not.toThrow();
  });

  test("reference upload stores bytes first and persisted catalog metadata second", async () => {
    const category = await references.createReferenceCategory({ slug: "test-vanities", label: "Test vanities", sortOrder: 1 });
    const image = await references.uploadReferenceImage({
      category: category.slug,
      label: "Oak wall-hung vanity",
      tags: ["oak", "wall-hung"],
      filename: "vanity.png",
      contentType: "image/png",
      bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      createdBy: "test",
    });
    uploadedFiles.push(path.join(process.cwd(), "public", image.url));
    const catalog = await references.listReferenceCatalog();
    expect(catalog.images.find((item) => item.id === image.id)).toMatchObject({
      categorySlug: "test-vanities",
      label: "Oak wall-hung vanity",
      tags: ["oak", "wall-hung"],
    });
  });
});
