import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import * as openpgp from "openpgp";

const scrypt = promisify(scryptCallback);

export async function normalizePublicKey(armoredKey: string) {
  const key = await openpgp.readKey({ armoredKey });
  if (key.isPrivate()) {
    throw new Error("A public key is required.");
  }
  return {
    publicKey: key.armor(),
    fingerprint: key.getFingerprint().toLowerCase(),
  };
}

export async function verifyDetachedSignature(input: {
  publicKey: string;
  payload: string;
  signature: string;
}) {
  try {
    const verificationKeys = await openpgp.readKey({ armoredKey: input.publicKey });
    const signature = await openpgp.readSignature({ armoredSignature: input.signature });
    const result = await openpgp.verify({
      message: await openpgp.createMessage({ text: input.payload }),
      signature,
      verificationKeys,
    });
    await result.signatures[0]?.verified;
    return result.signatures.length > 0;
  } catch {
    return false;
  }
}

export async function hashPin(pin: string, salt = randomBytes(16).toString("base64")) {
  const derived = (await scrypt(pin, Buffer.from(salt, "base64"), 32)) as Buffer;
  return { salt, hash: derived.toString("base64") };
}

export async function verifyPin(pin: string, salt: string, expectedHash: string) {
  const candidate = (await hashPin(pin, salt)).hash;
  const left = Buffer.from(candidate, "base64");
  const right = Buffer.from(expectedHash, "base64");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function safeTokenEquals(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue);
  const right = Buffer.from(rightValue);
  return left.length === right.length && timingSafeEqual(left, right);
}
