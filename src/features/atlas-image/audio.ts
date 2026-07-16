export type SupportedAudioFormat = {
  contentType: string;
  extension: string;
};

export const AUDIO_RECORDER_MIME_TYPE_CANDIDATES = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

const AUDIO_FORMATS: Record<string, SupportedAudioFormat> = {
  "application/ogg": { contentType: "audio/ogg", extension: "ogg" },
  "audio/flac": { contentType: "audio/flac", extension: "flac" },
  "audio/mp3": { contentType: "audio/mpeg", extension: "mp3" },
  "audio/mp4": { contentType: "audio/mp4", extension: "m4a" },
  "audio/mpeg": { contentType: "audio/mpeg", extension: "mp3" },
  "audio/ogg": { contentType: "audio/ogg", extension: "ogg" },
  "audio/wav": { contentType: "audio/wav", extension: "wav" },
  "audio/webm": { contentType: "audio/webm", extension: "webm" },
  "audio/x-flac": { contentType: "audio/flac", extension: "flac" },
  "audio/x-m4a": { contentType: "audio/mp4", extension: "m4a" },
  "audio/x-wav": { contentType: "audio/wav", extension: "wav" },
  "video/mp4": { contentType: "audio/mp4", extension: "m4a" },
  "video/webm": { contentType: "audio/webm", extension: "webm" },
};

function baseContentType(contentType: string) {
  return contentType.toLowerCase().split(";", 1)[0]?.trim() ?? "";
}

export function audioFormatFromContentType(contentType: string) {
  return AUDIO_FORMATS[baseContentType(contentType)] ?? null;
}

export function selectAudioRecorderMimeType(isTypeSupported?: (contentType: string) => boolean) {
  if (!isTypeSupported) return undefined;
  return AUDIO_RECORDER_MIME_TYPE_CANDIDATES.find((contentType) => isTypeSupported(contentType));
}

function matchesAscii(bytes: Uint8Array, offset: number, value: string) {
  return value.split("").every((character, index) => bytes[offset + index] === character.charCodeAt(0));
}

export function detectAudioFormat(bytes: Uint8Array, declaredContentType = "") {
  if (bytes.length >= 12 && matchesAscii(bytes, 4, "ftyp")) {
    return AUDIO_FORMATS["audio/mp4"];
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return AUDIO_FORMATS["audio/webm"];
  }
  if (bytes.length >= 4 && matchesAscii(bytes, 0, "OggS")) {
    return AUDIO_FORMATS["audio/ogg"];
  }
  if (bytes.length >= 12 && matchesAscii(bytes, 0, "RIFF") && matchesAscii(bytes, 8, "WAVE")) {
    return AUDIO_FORMATS["audio/wav"];
  }
  if (bytes.length >= 4 && matchesAscii(bytes, 0, "fLaC")) {
    return AUDIO_FORMATS["audio/flac"];
  }
  if (
    bytes.length >= 3 &&
    (matchesAscii(bytes, 0, "ID3") || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))
  ) {
    return AUDIO_FORMATS["audio/mpeg"];
  }
  return audioFormatFromContentType(declaredContentType);
}

export function audioRecordingFilename(format: SupportedAudioFormat) {
  return `direction.${format.extension}`;
}
