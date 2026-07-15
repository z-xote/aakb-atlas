import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";

import {
  authChallenges,
  deviceEnrollments,
  deviceSessions,
  devices,
  type DeviceRow,
} from "@/db/schema";
import { getDb, persistDatabase } from "@/db/client";
import { ApiError } from "@/services/api/response";
import {
  hashPin,
  normalizePublicKey,
  verifyDetachedSignature,
  verifyPin,
} from "@/services/auth/crypto";

const ENROLLMENT_TTL_MS = 15 * 60 * 1000;
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
export const SESSION_IDLE_MS = 15 * 60 * 1000;
const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;
const PIN_WINDOW_MS = 10 * 60 * 1000;
const PIN_LOCK_MS = 5 * 60 * 1000;
const PIN_FAILURE_LIMIT = 5;

function canonicalPayload(input: Record<string, unknown>) {
  return JSON.stringify({ version: 1, ...input });
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function uniqueEnrollmentCode() {
  const db = await getDb();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    if (!db.select({ id: deviceEnrollments.id }).from(deviceEnrollments).where(eq(deviceEnrollments.code, code)).get()) {
      return code;
    }
  }
  throw new ApiError(503, "code_unavailable", "Atlas could not allocate an activation code.");
}

export function shortFingerprint(fingerprint: string) {
  return fingerprint.slice(-16).toUpperCase().match(/.{1,4}/g)?.join(" ") ?? fingerprint;
}

export async function createEnrollment(input: {
  deviceName: string;
  clientInstanceId: string;
  publicKey: string;
  origin: string;
}) {
  let normalized: Awaited<ReturnType<typeof normalizePublicKey>>;
  try {
    normalized = await normalizePublicKey(input.publicKey);
  } catch {
    throw new ApiError(400, "invalid_public_key", "The submitted OpenPGP public key is invalid.");
  }

  const db = await getDb();
  const active = db
    .select({ id: devices.id })
    .from(devices)
    .where(and(eq(devices.fingerprint, normalized.fingerprint), eq(devices.status, "active")))
    .get();
  if (active) {
    throw new ApiError(409, "device_already_approved", "This device key is already approved.");
  }

  const id = `enrollment_${randomUUID()}`;
  const code = await uniqueEnrollmentCode();
  const now = Date.now();
  const expiresAt = now + ENROLLMENT_TTL_MS;
  const proofPayload = canonicalPayload({
    audience: "atlas-device-enrollment",
    purpose: "prove-possession",
    enrollmentId: id,
    origin: input.origin,
    nonce: randomBytes(32).toString("base64url"),
  });

  db.insert(deviceEnrollments)
    .values({
      id,
      code,
      clientInstanceId: input.clientInstanceId,
      deviceName: input.deviceName,
      publicKey: normalized.publicKey,
      fingerprint: normalized.fingerprint,
      proofPayload,
      proofVerifiedAt: null,
      status: "pending",
      approvedDeviceId: null,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  await persistDatabase();

  return {
    enrollmentId: id,
    proofChallenge: proofPayload,
    code,
    fingerprint: normalized.fingerprint,
    shortFingerprint: shortFingerprint(normalized.fingerprint),
    expiresAt,
  };
}

export async function proveEnrollment(enrollmentId: string, signature: string) {
  const db = await getDb();
  const enrollment = db
    .select()
    .from(deviceEnrollments)
    .where(eq(deviceEnrollments.id, enrollmentId))
    .get();

  if (!enrollment || enrollment.status !== "pending") {
    throw new ApiError(404, "enrollment_not_found", "The enrollment is not available.");
  }
  if (enrollment.expiresAt <= Date.now()) {
    db.update(deviceEnrollments)
      .set({ status: "expired", updatedAt: Date.now() })
      .where(eq(deviceEnrollments.id, enrollmentId))
      .run();
    await persistDatabase();
    throw new ApiError(410, "enrollment_expired", "The enrollment has expired.");
  }

  const valid = await verifyDetachedSignature({
    publicKey: enrollment.publicKey,
    payload: enrollment.proofPayload,
    signature,
  });
  if (!valid) {
    throw new ApiError(401, "invalid_key_proof", "The device key proof was not valid.");
  }

  const now = Date.now();
  db.update(deviceEnrollments)
    .set({ proofVerifiedAt: now, updatedAt: now })
    .where(eq(deviceEnrollments.id, enrollmentId))
    .run();
  await persistDatabase();
  return { verified: true };
}

export async function getEnrollmentStatus(enrollmentId: string) {
  const db = await getDb();
  const enrollment = db
    .select()
    .from(deviceEnrollments)
    .where(eq(deviceEnrollments.id, enrollmentId))
    .get();
  if (!enrollment) {
    throw new ApiError(404, "enrollment_not_found", "The enrollment is not available.");
  }

  let status = enrollment.status;
  if (status === "pending" && enrollment.expiresAt <= Date.now()) {
    status = "expired";
    db.update(deviceEnrollments)
      .set({ status, updatedAt: Date.now() })
      .where(eq(deviceEnrollments.id, enrollmentId))
      .run();
    await persistDatabase();
  }

  return {
    status,
    deviceId: status === "approved" ? enrollment.approvedDeviceId : null,
    pinRequired: status === "approved",
    expiresAt: enrollment.expiresAt,
  };
}

export async function approveEnrollment(code: string) {
  const db = await getDb();
  const enrollment = db
    .select()
    .from(deviceEnrollments)
    .where(eq(deviceEnrollments.code, code))
    .get();
  const now = Date.now();

  if (!enrollment || enrollment.status !== "pending") {
    throw new ApiError(404, "enrollment_not_found", "No pending enrollment matches that code.");
  }
  if (enrollment.expiresAt <= now) {
    throw new ApiError(410, "enrollment_expired", "That enrollment has expired.");
  }
  if (!enrollment.proofVerifiedAt) {
    throw new ApiError(409, "proof_required", "The device has not proved possession of its private key.");
  }

  const existing = db
    .select()
    .from(devices)
    .where(eq(devices.fingerprint, enrollment.fingerprint))
    .get();
  const deviceId = existing?.id ?? `device_${randomUUID()}`;

  db.transaction((tx) => {
    if (existing) {
      tx.update(devices)
        .set({
          deviceName: enrollment.deviceName,
          publicKey: enrollment.publicKey,
          status: "active",
          pinResetRequired: true,
          updatedAt: now,
        })
        .where(eq(devices.id, deviceId))
        .run();
    } else {
      tx.insert(devices)
        .values({
          id: deviceId,
          deviceName: enrollment.deviceName,
          publicKey: enrollment.publicKey,
          fingerprint: enrollment.fingerprint,
          status: "active",
          pinHash: null,
          pinSalt: null,
          pinResetRequired: true,
          failedAttemptCount: 0,
          firstFailedAt: null,
          lockedUntil: null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
    tx.update(deviceEnrollments)
      .set({ status: "approved", approvedDeviceId: deviceId, updatedAt: now })
      .where(eq(deviceEnrollments.id, enrollment.id))
      .run();
  });
  await persistDatabase();

  return {
    deviceId,
    deviceName: enrollment.deviceName,
    fingerprint: enrollment.fingerprint,
    shortFingerprint: shortFingerprint(enrollment.fingerprint),
    status: "active" as const,
  };
}

export async function listDevices() {
  const db = await getDb();
  return db
    .select({
      id: devices.id,
      name: devices.deviceName,
      fingerprint: devices.fingerprint,
      status: devices.status,
      pinResetRequired: devices.pinResetRequired,
      lockedUntil: devices.lockedUntil,
      createdAt: devices.createdAt,
      updatedAt: devices.updatedAt,
    })
    .from(devices)
    .orderBy(desc(devices.updatedAt))
    .all();
}

export async function issueChallenge(input: {
  deviceId: string;
  purpose: "unlock" | "pin_set";
  origin: string;
}) {
  const db = await getDb();
  const device = db
    .select({ id: devices.id })
    .from(devices)
    .where(and(eq(devices.id, input.deviceId), eq(devices.status, "active")))
    .get();
  const id = `challenge_${randomUUID()}`;
  const now = Date.now();
  const expiresAt = now + CHALLENGE_TTL_MS;
  const payload = canonicalPayload({
    audience: "atlas-device-auth",
    purpose: input.purpose,
    challengeId: id,
    origin: input.origin,
    nonce: randomBytes(32).toString("base64url"),
  });

  db.insert(authChallenges)
    .values({
      id,
      deviceId: device?.id ?? null,
      purpose: input.purpose,
      canonicalPayload: payload,
      expiresAt,
      consumedAt: null,
      createdAt: now,
    })
    .run();
  await persistDatabase();
  return { challengeId: id, payload, expiresAt };
}

async function consumeChallenge(challengeId: string, purpose: "unlock" | "pin_set") {
  const db = await getDb();
  const challenge = db
    .select()
    .from(authChallenges)
    .where(and(eq(authChallenges.id, challengeId), eq(authChallenges.purpose, purpose), isNull(authChallenges.consumedAt)))
    .get();
  if (!challenge) {
    throw new ApiError(401, "invalid_challenge", "The authentication challenge is invalid or already used.");
  }

  db.update(authChallenges)
    .set({ consumedAt: Date.now() })
    .where(eq(authChallenges.id, challenge.id))
    .run();
  await persistDatabase();

  if (challenge.expiresAt <= Date.now() || !challenge.deviceId) {
    throw new ApiError(401, "invalid_challenge", "The authentication challenge is invalid or expired.");
  }
  return challenge;
}

async function verifyChallengeProof(input: {
  challengeId: string;
  purpose: "unlock" | "pin_set";
  signature: string;
}) {
  const challenge = await consumeChallenge(input.challengeId, input.purpose);
  const db = await getDb();
  const device = db
    .select()
    .from(devices)
    .where(and(eq(devices.id, challenge.deviceId!), eq(devices.status, "active")))
    .get();
  if (!device) {
    throw new ApiError(401, "invalid_device_proof", "The device proof could not be verified.");
  }
  const valid = await verifyDetachedSignature({
    publicKey: device.publicKey,
    payload: challenge.canonicalPayload,
    signature: input.signature,
  });
  if (!valid) {
    throw new ApiError(401, "invalid_device_proof", "The device proof could not be verified.");
  }
  return device;
}

export async function setDevicePin(input: {
  enrollmentId: string;
  challengeId: string;
  signature: string;
  pin: string;
  confirmPin: string;
}) {
  if (input.pin !== input.confirmPin) {
    throw new ApiError(400, "pin_mismatch", "The PIN confirmation does not match.");
  }
  const device = await verifyChallengeProof({ ...input, purpose: "pin_set" });
  const db = await getDb();
  const enrollment = db
    .select({ id: deviceEnrollments.id })
    .from(deviceEnrollments)
    .where(
      and(
        eq(deviceEnrollments.id, input.enrollmentId),
        eq(deviceEnrollments.status, "approved"),
        eq(deviceEnrollments.approvedDeviceId, device.id)
      )
    )
    .get();
  if (!enrollment) {
    throw new ApiError(401, "invalid_enrollment_binding", "The approved enrollment does not match this device key.");
  }
  if (!device.pinResetRequired && device.pinHash) {
    throw new ApiError(409, "pin_already_set", "This device already has a PIN.");
  }
  const next = await hashPin(input.pin);
  db.update(devices)
    .set({
      pinHash: next.hash,
      pinSalt: next.salt,
      pinResetRequired: false,
      failedAttemptCount: 0,
      firstFailedAt: null,
      lockedUntil: null,
      updatedAt: Date.now(),
    })
    .where(eq(devices.id, device.id))
    .run();
  await persistDatabase();
  return createDeviceSession(device.id);
}

async function recordPinFailure(device: DeviceRow) {
  const db = await getDb();
  const now = Date.now();
  const withinWindow = Boolean(device.firstFailedAt && now - device.firstFailedAt < PIN_WINDOW_MS);
  const nextCount = withinWindow ? device.failedAttemptCount + 1 : 1;
  const lockedUntil = nextCount >= PIN_FAILURE_LIMIT ? now + PIN_LOCK_MS : null;
  db.update(devices)
    .set({
      failedAttemptCount: nextCount,
      firstFailedAt: withinWindow ? device.firstFailedAt : now,
      lockedUntil,
      updatedAt: now,
    })
    .where(eq(devices.id, device.id))
    .run();
  await persistDatabase();
  return {
    remainingAttempts: Math.max(0, PIN_FAILURE_LIMIT - nextCount),
    retryAfterSeconds: lockedUntil ? Math.ceil(PIN_LOCK_MS / 1000) : 0,
  };
}

export async function verifyDeviceUnlock(input: {
  challengeId: string;
  signature: string;
  pin: string;
}) {
  const device = await verifyChallengeProof({ ...input, purpose: "unlock" });
  const now = Date.now();
  if (device.lockedUntil && device.lockedUntil > now) {
    throw new ApiError(429, "device_locked", "This device is temporarily locked.", {
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil((device.lockedUntil - now) / 1000),
    });
  }
  if (device.pinResetRequired || !device.pinHash || !device.pinSalt) {
    throw new ApiError(409, "pin_setup_required", "This device must set a new PIN.");
  }
  if (!(await verifyPin(input.pin, device.pinSalt, device.pinHash))) {
    const feedback = await recordPinFailure(device);
    throw new ApiError(
      feedback.retryAfterSeconds ? 429 : 401,
      feedback.retryAfterSeconds ? "device_locked" : "invalid_pin",
      feedback.retryAfterSeconds ? "This device is temporarily locked." : "The PIN was not correct.",
      feedback
    );
  }

  const db = await getDb();
  db.update(devices)
    .set({ failedAttemptCount: 0, firstFailedAt: null, lockedUntil: null, updatedAt: now })
    .where(eq(devices.id, device.id))
    .run();
  await persistDatabase();
  return createDeviceSession(device.id);
}

export async function createDeviceSession(deviceId: string) {
  const db = await getDb();
  const now = Date.now();
  const token = randomBytes(32).toString("base64url");
  db.insert(deviceSessions)
    .values({
      id: `session_${randomUUID()}`,
      tokenHash: hashSessionToken(token),
      deviceId,
      lastActivityAt: now,
      expiresAt: now + SESSION_ABSOLUTE_MS,
      revokedAt: null,
      createdAt: now,
    })
    .run();
  await persistDatabase();
  return { token, deviceId, idleExpiresAt: now + SESSION_IDLE_MS };
}

export async function findActiveSession(token: string) {
  const db = await getDb();
  const now = Date.now();
  const row = db
    .select({ session: deviceSessions, device: devices })
    .from(deviceSessions)
    .innerJoin(devices, eq(devices.id, deviceSessions.deviceId))
    .where(
      and(
        eq(deviceSessions.tokenHash, hashSessionToken(token)),
        isNull(deviceSessions.revokedAt),
        eq(devices.status, "active")
      )
    )
    .get();
  if (!row || row.session.expiresAt <= now || row.session.lastActivityAt + SESSION_IDLE_MS <= now) {
    return null;
  }
  return row;
}

export async function touchSession(token: string) {
  const row = await findActiveSession(token);
  if (!row) return null;
  const db = await getDb();
  db.update(deviceSessions)
    .set({ lastActivityAt: Date.now() })
    .where(eq(deviceSessions.id, row.session.id))
    .run();
  await persistDatabase();
  return { deviceId: row.device.id };
}

export async function revokeSessionToken(token: string) {
  const db = await getDb();
  db.update(deviceSessions)
    .set({ revokedAt: Date.now() })
    .where(eq(deviceSessions.tokenHash, hashSessionToken(token)))
    .run();
  await persistDatabase();
}

export async function resetDevicePin(deviceId: string) {
  const db = await getDb();
  const device = db.select().from(devices).where(eq(devices.id, deviceId)).get();
  if (!device) throw new ApiError(404, "device_not_found", "No device matches that ID.");
  const now = Date.now();
  db.transaction((tx) => {
    tx.update(devices)
      .set({
        pinHash: null,
        pinSalt: null,
        pinResetRequired: true,
        failedAttemptCount: 0,
        firstFailedAt: null,
        lockedUntil: null,
        updatedAt: now,
      })
      .where(eq(devices.id, deviceId))
      .run();
    tx.update(deviceSessions)
      .set({ revokedAt: now })
      .where(and(eq(deviceSessions.deviceId, deviceId), isNull(deviceSessions.revokedAt)))
      .run();
    tx.update(authChallenges)
      .set({ consumedAt: now })
      .where(and(eq(authChallenges.deviceId, deviceId), isNull(authChallenges.consumedAt)))
      .run();
  });
  await persistDatabase();
  return { deviceId, pinResetRequired: true, sessionsRevoked: true };
}

export async function revokeDevice(deviceId: string) {
  const db = await getDb();
  const device = db.select().from(devices).where(eq(devices.id, deviceId)).get();
  if (!device) throw new ApiError(404, "device_not_found", "No device matches that ID.");
  const now = Date.now();
  db.transaction((tx) => {
    tx.update(devices).set({ status: "revoked", updatedAt: now }).where(eq(devices.id, deviceId)).run();
    tx.update(deviceSessions)
      .set({ revokedAt: now })
      .where(and(eq(deviceSessions.deviceId, deviceId), isNull(deviceSessions.revokedAt)))
      .run();
    tx.update(authChallenges)
      .set({ consumedAt: now })
      .where(and(eq(authChallenges.deviceId, deviceId), isNull(authChallenges.consumedAt)))
      .run();
  });
  await persistDatabase();
  return { deviceId, status: "revoked" as const, sessionsRevoked: true };
}
