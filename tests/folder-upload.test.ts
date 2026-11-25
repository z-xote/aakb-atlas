import { describe, expect, test } from "bun:test";

import { isFolderAsset } from "@/features/files/folder-asset-id";
import { identifyFolderPhoto, selectFolderPhotos } from "@/features/files/folder-upload";
import { MAX_FILE_ASSET_BYTES } from "@/features/files/schemas";

function folderFile(path: string, bytes: string, lastModified?: number) {
  const file = new File([bytes], path.split("/").pop()!, { lastModified });
  return Object.defineProperty(file, "webkitRelativePath", { value: path });
}

describe("Site image folder selection", () => {
  test("selects supported photos within the upload limit", () => {
    const first = new File(["first"], "Before.JPG", { type: "image/jpeg" });
    const second = new File(["second"], "Before.JPG", { type: "image/jpeg" });
    const iPhonePhoto = new File(["photo"], "iPhone.HEIC");
    const atLimit = new File([new Uint8Array(MAX_FILE_ASSET_BYTES)], "large.png");

    const result = selectFolderPhotos([
      first,
      second,
      iPhonePhoto,
      atLimit,
      new File(["notes"], "measurements.pdf", { type: "application/pdf" }),
      new File(["sidecar"], "._Before.JPG"),
      new File([], "empty.png"),
      new File([new Uint8Array(MAX_FILE_ASSET_BYTES + 1)], "too-large.png"),
    ]);

    expect(result.photos).toEqual([first, second, iPhonePhoto, atLimit]);
    expect(result.skipped).toBe(4);
  });

  test("returns no uploads for a folder without photos", () => {
    expect(selectFolderPhotos([new File(["notes"], "notes.txt")])).toEqual({ photos: [], skipped: 1 });
    expect(selectFolderPhotos([])).toEqual({ photos: [], skipped: 0 });
  });

  test("recognizes a reselected photo by its path and contents", async () => {
    const photo = folderFile("Visit/Before.JPG", "photo", 1000);
    const reselected = folderFile("Visit/Before.JPG", "photo", 2000);
    const first = await identifyFolderPhoto("file_1", photo);
    expect(await identifyFolderPhoto("file_1", reselected)).toEqual(first);
    expect(first.uploadKey).toMatch(/^[0-9a-f]{64}$/);
    expect(isFolderAsset(first.assetId)).toBe(true);
    expect((await identifyFolderPhoto("file_2", photo)).assetId).not.toBe(first.assetId);
  });

  test("keeps edited photos and same-name photos in different folders distinct", async () => {
    const first = await identifyFolderPhoto("file_1", folderFile("Visit/Before.JPG", "photo"));
    const nested = await identifyFolderPhoto("file_1", folderFile("Visit/Kitchen/Before.JPG", "photo"));
    const changed = await identifyFolderPhoto("file_1", folderFile("Visit/Before.JPG", "PHOTO"));
    expect(nested.uploadKey).not.toBe(first.uploadKey);
    expect(changed.uploadKey).toBe(first.uploadKey);
    expect(new Set([first.assetId, nested.assetId, changed.assetId]).size).toBe(3);
  });
});
