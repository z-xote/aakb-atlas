import { describe, expect, test } from "bun:test";

import { selectFolderPhotos } from "@/features/files/folder-upload";
import { MAX_FILE_ASSET_BYTES } from "@/features/files/schemas";

describe("Site image folder selection", () => {
  test("selects supported photos and gives same-name photos separate upload keys", () => {
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

    expect(result.photos.map((photo) => photo.file)).toEqual([first, second, iPhonePhoto, atLimit]);
    expect(result.skipped).toBe(4);
    const keys = result.photos.map((photo) => photo.uploadKey);
    expect(keys.every((key) => /^[0-9a-f]{32}$/.test(key))).toBe(true);
    expect(new Set(keys).size).toBe(4);
  });

  test("returns no uploads for a folder without photos", () => {
    expect(selectFolderPhotos([new File(["notes"], "notes.txt")])).toEqual({ photos: [], skipped: 1 });
    expect(selectFolderPhotos([])).toEqual({ photos: [], skipped: 0 });
  });
});
