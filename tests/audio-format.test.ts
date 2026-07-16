import { describe, expect, test } from "bun:test";

import {
  audioFormatFromContentType,
  audioRecordingFilename,
  detectAudioFormat,
  selectAudioRecorderMimeType,
} from "@/features/atlas-image/audio";

function bytes(value: string) {
  return Uint8Array.from(value, (character) => character.charCodeAt(0));
}

describe("Atlas voice recording formats", () => {
  test("prefers iPad-compatible AAC in MP4 and falls back across browser formats", () => {
    expect(selectAudioRecorderMimeType((type) => type === "audio/mp4")).toBe("audio/mp4");
    expect(selectAudioRecorderMimeType((type) => type === "audio/webm;codecs=opus")).toBe("audio/webm;codecs=opus");
    expect(selectAudioRecorderMimeType(() => false)).toBeUndefined();
  });

  test("normalizes browser MIME types and codec parameters to matching filenames", () => {
    const safari = audioFormatFromContentType("audio/mp4;codecs=mp4a.40.2");
    const chrome = audioFormatFromContentType("audio/webm;codecs=opus");
    expect(safari).toEqual({ contentType: "audio/mp4", extension: "m4a" });
    expect(chrome).toEqual({ contentType: "audio/webm", extension: "webm" });
    expect(audioRecordingFilename(safari!)).toBe("direction.m4a");
    expect(audioRecordingFilename(chrome!)).toBe("direction.webm");
  });

  test("detects the real container even when the browser supplies the wrong label", () => {
    const mp4 = new Uint8Array(16);
    mp4.set(bytes("ftyp"), 4);
    expect(detectAudioFormat(mp4, "audio/webm")).toEqual({ contentType: "audio/mp4", extension: "m4a" });

    const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]);
    expect(detectAudioFormat(webm, "audio/mp4")).toEqual({ contentType: "audio/webm", extension: "webm" });
  });

  test("recognizes all bounded transcription formats emitted by supported browsers", () => {
    expect(detectAudioFormat(bytes("OggS"))?.extension).toBe("ogg");
    expect(detectAudioFormat(bytes("RIFF0000WAVE"))?.extension).toBe("wav");
    expect(detectAudioFormat(bytes("fLaC"))?.extension).toBe("flac");
    expect(detectAudioFormat(bytes("ID3"))?.extension).toBe("mp3");
    expect(detectAudioFormat(new Uint8Array([1, 2, 3]), "audio/x-m4a")?.extension).toBe("m4a");
    expect(detectAudioFormat(new Uint8Array([1, 2, 3]), "application/octet-stream")).toBeNull();
  });
});
