import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

const folderAssetPrefix = "asset_folder_";

export function folderAssetId(fileId: string, uploadKey: string, bytes: Uint8Array) {
  const hash = sha256.create().update(`${fileId}:${uploadKey}`);
  // The first version of folder upload used a random 32-character key.
  if (uploadKey.length === 32) return `asset_${bytesToHex(hash.digest())}`;
  return `${folderAssetPrefix}${bytesToHex(hash.update(bytes).digest())}`;
}

export function isFolderAsset(id: string) {
  return id.startsWith(folderAssetPrefix);
}
