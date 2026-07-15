"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  CheckIcon,
  ImageIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";

import { ClockDial } from "@/features/files/components/image-primitives";
import {
  clockPositionHints,
  roomChoices,
  type ClockPosition,
} from "@/types/atlas";

type UploadState = "idle" | "uploading" | "failed";
type CameraState = "starting" | "live" | "denied" | "unavailable";

function cameraFailure(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return {
      state: "denied" as const,
      message:
        "Camera access was blocked. Allow camera access in the browser's site controls, then retry.",
    };
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return {
      state: "unavailable" as const,
      message: "Atlas could not find a connected camera on this device.",
    };
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return {
      state: "unavailable" as const,
      message:
        "The camera is already in use or could not be started. Close other camera apps and retry.",
    };
  }
  return {
    state: "unavailable" as const,
    message: "Atlas could not start this camera. You can retry or upload a photo.",
  };
}

export function PhotoCapture({
  fileId,
  fileTitle,
  initialMode,
  returnTo,
}: {
  fileId: string;
  fileTitle: string;
  initialMode: "camera" | "upload";
  returnTo?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [origin, setOrigin] = useState<"camera" | "upload">(initialMode);
  const [cameraState, setCameraState] = useState<CameraState>(
    initialMode === "camera" ? "starting" : "unavailable"
  );
  const [cameraMessage, setCameraMessage] = useState(
    initialMode === "upload"
      ? "Choose a photo from this device."
      : "Requesting the available camera…"
  );
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [clock, setClock] = useState<ClockPosition | null>(null);
  const [room, setRoom] = useState<string | null>("Bathroom");
  const [customOpen, setCustomOpen] = useState(false);
  const [customRoom, setCustomRoom] = useState("");
  const [label, setLabel] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState("");
  const [retryAssetId, setRetryAssetId] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      const requestId = cameraRequestRef.current + 1;
      cameraRequestRef.current = requestId;
      stopCamera();
      setCameraState("starting");
      setCameraMessage(
        "Allow camera access in the browser prompt. Atlas will reuse any permission the browser saves."
      );

      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        setCameraMessage(
          "Live camera access requires HTTPS or localhost. Upload remains available on an insecure network address."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
        });
        if (requestId !== cameraRequestRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        const activeDevice = stream.getVideoTracks()[0]?.getSettings().deviceId;
        const devices = await navigator.mediaDevices
          .enumerateDevices()
          .catch(() => []);
        setCameras(devices.filter((device) => device.kind === "videoinput"));
        setSelectedCamera(activeDevice ?? deviceId ?? "");
        setCameraState("live");
        setCameraMessage("");
        setOrigin("camera");
      } catch (cameraError) {
        if (requestId !== cameraRequestRef.current) return;
        const failure = cameraFailure(cameraError);
        setCameraState(failure.state);
        setCameraMessage(failure.message);
      }
    },
    [stopCamera]
  );

  useEffect(() => {
    if (initialMode !== "camera") return;
    const request = window.setTimeout(() => void startCamera(), 0);
    return () => {
      window.clearTimeout(request);
      cameraRequestRef.current += 1;
      stopCamera();
    };
  }, [initialMode, startCamera, stopCamera]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  function chooseUpload() {
    cameraRequestRef.current += 1;
    stopCamera();
    setOrigin("upload");
    inputRef.current?.click();
  }

  function acceptSelectedFile(selected: File) {
    stopCamera();
    setOrigin("upload");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || cameraState !== "live" || !video.videoWidth) {
      setCameraMessage("The camera is not ready yet. Wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraMessage("Atlas could not capture this frame. Try again.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) {
      setCameraMessage("Atlas could not capture this frame. Try again.");
      return;
    }

    const captured = new File([blob], `site-photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    stopCamera();
    setOrigin("camera");
    setFile(captured);
    setPreview(URL.createObjectURL(captured));
  }

  function retake() {
    setUploadState("idle");
    setError("");
    setRetryAssetId(null);
    setFile(null);
    setPreview("");
    setOrigin("camera");
    void startCamera(selectedCamera || undefined);
  }

  async function save() {
    if (!file || uploadState === "uploading") return;
    setUploadState("uploading");
    setError("");
    const form = new FormData();
    form.set("image", file);
    form.set(
      "label",
      label.trim() || file.name.replace(/\.[^.]+$/, "") || "Site photo"
    );
    form.set("room", room ?? "");
    form.set("origin", origin);
    form.set("cameraPositionClock", clock ?? "");
    form.set("tags", "[]");
    form.set("retryAssetId", retryAssetId ?? "");

    try {
      const response = await fetch(`/api/files/${fileId}/assets`, {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as {
        ok: boolean;
        data?: { id?: string };
        error?: { message?: string; details?: { assetId?: string } };
      };
      if (!response.ok || !body.ok) {
        setRetryAssetId(body.error?.details?.assetId ?? retryAssetId);
        setError(body.error?.message ?? "Atlas could not upload this image.");
        setUploadState("failed");
        return;
      }
      const destination = returnTo && body.data?.id
        ? `${returnTo}${returnTo.includes("?") ? "&" : "?"}select=${encodeURIComponent(body.data.id)}`
        : `/files/${fileId}/images`;
      router.push(destination);
      router.refresh();
    } catch {
      setError("Atlas could not reach the upload service. Try again.");
      setUploadState("failed");
    }
  }

  return (
    <main
      className="flex min-h-dvh flex-1 flex-col"
      style={{
        background: file ? "var(--atlas-bg-root)" : "#0c0a09",
        color: file ? "var(--atlas-text-primary)" : "#fafaf9",
      }}
    >
      <input
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) acceptSelectedFile(selected);
          event.currentTarget.value = "";
        }}
        ref={inputRef}
        type="file"
      />

      {!file ? (
        <div
          className="relative flex min-h-dvh flex-1 flex-col overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, #57534e 0, #292524 38%, #0c0a09 78%)",
          }}
        >
          <video
            aria-label="Live camera preview"
            autoPlay
            className="absolute inset-0 size-full object-cover transition-opacity"
            muted
            playsInline
            ref={videoRef}
            style={{ opacity: cameraState === "live" ? 1 : 0 }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 42%, transparent 46%, rgba(12,10,9,0.72) 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "33.333% 33.333%",
            }}
          />

          <div className="relative flex items-center justify-between gap-2 p-4">
            <span className="inline-flex h-9 max-w-[calc(100%-52px)] items-center gap-2 truncate rounded-full border border-white/20 bg-black/50 px-3 text-xs font-bold backdrop-blur">
              <span
                className="size-2 rounded-full"
                style={{
                  background: cameraState === "live" ? "#4ade80" : "#f87171",
                }}
              />
              <span className="truncate">{fileTitle}</span>
            </span>
            <Link
              aria-label="Close camera"
              className="grid size-11 place-items-center rounded-full border border-white/20 bg-black/50 backdrop-blur"
               href={returnTo ?? `/files/${fileId}/images`}
              onClick={stopCamera}
            >
              <XIcon className="size-5" />
            </Link>
          </div>

          {cameraState === "live" && cameras.length > 1 ? (
            <div className="relative flex justify-center px-4">
              <select
                aria-label="Camera source"
                className="h-10 max-w-72 rounded-full border border-white/20 bg-black/60 px-4 text-sm font-bold text-white backdrop-blur"
                onChange={(event) => void startCamera(event.target.value)}
                value={selectedCamera}
              >
                {cameras.map((camera, index) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="relative grid flex-1 place-items-center px-6 text-center">
            {cameraState !== "live" ? (
              <div className="grid max-w-md gap-3 rounded-2xl border border-white/15 bg-black/50 p-5 backdrop-blur">
                <CameraIcon className="mx-auto size-10 opacity-80" />
                <strong>
                  {cameraState === "starting"
                    ? "Connecting to the camera"
                    : initialMode === "upload"
                      ? "Choose a photo from this device"
                      : "Camera unavailable"}
                </strong>
                <span className="text-sm opacity-75">{cameraMessage}</span>
                {cameraState !== "starting" && initialMode === "camera" ? (
                  <button
                    className="mx-auto inline-flex h-10 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-bold"
                    onClick={() => void startCamera(selectedCamera || undefined)}
                    type="button"
                  >
                    <RefreshCwIcon className="size-4" />
                    Retry camera access
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="relative flex items-center justify-between gap-3 bg-linear-to-t from-black/80 to-transparent px-6 pb-8 pt-5">
            <button
              className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-black/50 text-[10px] font-bold"
              onClick={chooseUpload}
              type="button"
            >
              <ImageIcon className="size-5" />
              <span>Upload</span>
            </button>
            <button
              aria-label={cameraState === "live" ? "Take photo" : "Enable camera"}
              className="grid size-[76px] place-items-center rounded-full border-4 border-white/90 transition-opacity active:scale-95 disabled:opacity-45"
              disabled={cameraState === "starting"}
              onClick={() =>
                cameraState === "live"
                  ? void captureFrame()
                  : initialMode === "upload"
                    ? chooseUpload()
                    : void startCamera(selectedCamera || undefined)
              }
              type="button"
            >
              <span className="size-[58px] rounded-full bg-white" />
            </button>
            <span className="grid size-14 place-items-center rounded-2xl border border-white/20 bg-black/40">
              <CameraIcon className="size-5" />
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-5 p-4 pb-2">
            <div className="flex justify-end">
              <Link
                className="atlas-btn atlas-btn-outline h-9 px-3"
                 href={returnTo ?? `/files/${fileId}/images`}
              >
                <XIcon />
                Cancel
              </Link>
            </div>
            <div>
              <div
                className="relative mx-auto aspect-4/3 w-full max-w-3xl overflow-hidden"
                style={{
                  borderRadius: "var(--atlas-radius)",
                  background: "var(--atlas-bg-muted)",
                }}
              >
                {preview ? (
                  <Image
                    alt="Fresh shot to review"
                    className="object-contain"
                    fill
                    src={preview}
                    unoptimized
                  />
                ) : null}
              </div>
              <p className="atlas-muted mt-2 text-xs font-bold">
                Fresh shot · just now — add a few details or skip straight to
                saving.
              </p>
            </div>

            <section className="atlas-simple-panel">
              <div className="atlas-simple-panel-head">
                <h2 className="text-base!">Where was the camera?</h2>
                <span className="atlas-muted text-xs font-bold">Optional</span>
              </div>
              <div className="atlas-simple-panel-body flex flex-col items-center gap-2">
                <ClockDial onChange={setClock} value={clock} />
                <p
                  className="text-sm font-bold"
                  style={{
                    color: clock
                      ? "var(--atlas-text-primary)"
                      : "var(--atlas-text-tertiary)",
                  }}
                >
                  {clock
                    ? clockPositionHints[clock]
                    : "Tap a spot — door is 12 o'clock"}
                </p>
                <p className="atlas-muted text-xs font-bold">
                  Optional — skip if unsure
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <span className="atlas-label">Room / area</span>
              <div className="flex flex-wrap gap-2">
                {roomChoices.map((choice) => {
                  const active = room === choice && !customOpen;
                  return (
                    <button
                      className="inline-flex h-11 items-center rounded-full border px-4 text-sm font-bold"
                      key={choice}
                      onClick={() => {
                        setRoom(active ? null : choice);
                        setCustomOpen(false);
                      }}
                      style={{
                        borderColor: active
                          ? "var(--atlas-accent)"
                          : "var(--atlas-border)",
                        background: active
                          ? "var(--atlas-accent-soft)"
                          : "var(--atlas-bg-surface)",
                        color: active
                          ? "var(--atlas-accent)"
                          : "var(--atlas-text-secondary)",
                      }}
                      type="button"
                    >
                      {choice}
                    </button>
                  );
                })}
                {customOpen ? (
                  <input
                    autoFocus
                    className="h-11 min-w-0 flex-1 rounded-full border px-4 text-sm font-bold outline-none"
                    onChange={(event) => {
                      setCustomRoom(event.target.value);
                      setRoom(event.target.value || null);
                    }}
                    placeholder="Type a room…"
                    style={{
                      borderColor: "var(--atlas-accent)",
                      background: "var(--atlas-bg-surface)",
                    }}
                    value={customRoom}
                  />
                ) : (
                  <button
                    className="inline-flex h-11 items-center gap-1 rounded-full border border-dashed px-4 text-sm font-bold"
                    onClick={() => {
                      setCustomOpen(true);
                      setRoom(customRoom || null);
                    }}
                    type="button"
                  >
                    <PlusIcon className="size-4" />
                    Custom…
                  </button>
                )}
              </div>
            </section>

            <label className="flex flex-col gap-2">
              <span className="atlas-label">Label</span>
              <input
                className="h-11 w-full border px-3 text-sm font-bold outline-none"
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Vanity wall"
                style={{
                  borderColor: "var(--atlas-border-strong)",
                  borderRadius: "var(--atlas-radius)",
                  background: "var(--atlas-bg-surface)",
                }}
                value={label}
              />
            </label>
            {error ? (
              <div
                className="rounded border p-3 text-sm font-bold"
                role="alert"
                style={{
                  borderColor: "var(--destructive)",
                  background:
                    "color-mix(in srgb, var(--destructive) 10%, transparent)",
                  color: "var(--destructive)",
                }}
              >
                {error} The failed state is saved; this button will retry the
                same image record.
              </div>
            ) : null}
          </div>

          <div
            className="sticky bottom-0 flex flex-col gap-2 border-t px-4 pb-5 pt-3"
            style={{
              borderColor: "var(--atlas-border)",
              background:
                "color-mix(in srgb, var(--atlas-bg-surface) 92%, transparent)",
              backdropFilter: "blur(14px)",
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <button
                className="atlas-btn atlas-btn-outline h-12!"
                disabled={uploadState === "uploading"}
                onClick={retake}
                type="button"
              >
                <RotateCcwIcon />
                Retake
              </button>
              <button
                className="atlas-btn atlas-btn-primary h-12!"
                disabled={uploadState === "uploading"}
                onClick={save}
                type="button"
              >
                {uploadState === "uploading" ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    {uploadState === "failed" ? "Retry upload" : "Save to file"}
                  </>
                )}
              </button>
            </div>
            <p className="atlas-muted text-center text-xs font-bold">
              Saved to {fileTitle} · Atlas uploads to Bunny through the server
            </p>
          </div>
        </>
      )}
    </main>
  );
}
