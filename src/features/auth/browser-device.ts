"use client";

import * as openpgp from "openpgp";

const DATABASE_NAME = "atlas-device-identity";
const STORE_NAME = "identity";
const RECORD_KEY = "current";

export type BrowserDeviceIdentity = {
  clientInstanceId: string;
  deviceName: string;
  publicKey: string;
  wrappingKey: CryptoKey;
  privateKeyIv: number[];
  encryptedPrivateKey: ArrayBuffer;
  enrollmentId?: string;
  deviceId?: string;
  activationCode?: string;
  shortFingerprint?: string;
  needsPin?: boolean;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function loadBrowserDevice() {
  return transact<BrowserDeviceIdentity | undefined>("readonly", (store) => store.get(RECORD_KEY));
}

export async function saveBrowserDevice(identity: BrowserDeviceIdentity) {
  await transact("readwrite", (store) => store.put(identity, RECORD_KEY));
  return identity;
}

export async function updateBrowserDevice(update: Partial<BrowserDeviceIdentity>) {
  const current = await loadBrowserDevice();
  if (!current) throw new Error("No Atlas device identity exists in this browser.");
  return saveBrowserDevice({ ...current, ...update });
}

export async function createBrowserDevice(deviceName: string) {
  const generated = await openpgp.generateKey({
    type: "ecc",
    curve: "ed25519Legacy",
    userIDs: [{ name: deviceName }],
    format: "armored",
  });
  const wrappingKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedPrivateKey = new TextEncoder().encode(generated.privateKey);
  const encryptedPrivateKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    encodedPrivateKey
  );
  return saveBrowserDevice({
    clientInstanceId: crypto.randomUUID(),
    deviceName,
    publicKey: generated.publicKey,
    wrappingKey,
    privateKeyIv: Array.from(iv),
    encryptedPrivateKey,
  });
}

async function readPrivateKey(identity: BrowserDeviceIdentity) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(identity.privateKeyIv) },
    identity.wrappingKey,
    identity.encryptedPrivateKey
  );
  return openpgp.readPrivateKey({ armoredKey: new TextDecoder().decode(decrypted) });
}

export async function signDevicePayload(payload: string) {
  const identity = await loadBrowserDevice();
  if (!identity) throw new Error("No Atlas device key exists in this browser.");
  const signingKeys = await readPrivateKey(identity);
  return openpgp.sign({
    message: await openpgp.createMessage({ text: payload }),
    signingKeys,
    detached: true,
    format: "armored",
  });
}
