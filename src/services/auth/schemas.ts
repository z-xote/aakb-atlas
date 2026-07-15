import { z } from "zod";

const identifier = z.string().trim().min(1).max(120);
const signature = z.string().min(40).max(200_000);

export const enrollmentSchema = z.object({
  deviceName: z.string().trim().min(1).max(80),
  clientInstanceId: identifier,
  publicKey: z.string().min(80).max(200_000),
});

export const enrollmentProofSchema = z.object({ signature });

export const challengeSchema = z.object({
  deviceId: identifier,
  purpose: z.enum(["unlock", "pin_set"]),
});

export const pinSchema = z.string().regex(/^\d{4}$/, "PIN must contain exactly four digits.");

export const setPinSchema = z.object({
  challengeId: identifier,
  signature,
  pin: pinSchema,
  confirmPin: pinSchema,
});

export const verifyDeviceSchema = z.object({
  challengeId: identifier,
  signature,
  pin: pinSchema,
});
