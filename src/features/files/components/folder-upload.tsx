"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { FolderUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import type { FileAssetDto } from "@/features/files/data";
import { isFolderAsset } from "@/features/files/folder-asset-id";
import { identifyFolderPhoto, selectFolderPhotos, uploadFolderPhoto } from "@/features/files/folder-upload";

type FailedPhoto = { file: File; message: string };
type Batch = {
  total: number;
  uploaded: number;
  skipped: number;
  failed: FailedPhoto[];
  running: boolean;
};

export function FolderUpload({
  assets,
  children,
  fileId,
  onUploaded,
}: {
  assets: Pick<FileAssetDto, "id" | "status">[];
  children: ReactNode;
  fileId: string;
  onUploaded: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const runningRef = useRef(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [pickerError, setPickerError] = useState("");
  const [confirmedIds, setConfirmedIds] = useState(() => new Set<string>());

  const needsFolder = !batch?.running && !batch?.failed.length && assets.some(
    ({ id, status }) => isFolderAsset(id) && status !== "ready" && !confirmedIds.has(id)
  );

  useEffect(() => () => {
    runningRef.current = false;
  }, []);

  function openPicker() {
    const input = inputRef.current;
    if (!input || !("webkitdirectory" in input)) {
      setPickerError("This browser cannot select folders. Use Add to upload individual photos.");
      return;
    }
    input.webkitdirectory = true;
    input.click();
  }

  async function upload(photos: File[], skipped: number, alreadyUploaded = 0) {
    if (runningRef.current) return;
    runningRef.current = photos.length > 0;
    const total = photos.length + alreadyUploaded;
    let uploaded = alreadyUploaded;
    const failed: FailedPhoto[] = [];
    setBatch({ total, uploaded, skipped, failed, running: runningRef.current });
    if (!photos.length) return;

    const saved = new Set(confirmedIds);
    for (const { id, status } of assets) {
      if (status === "ready" && isFolderAsset(id)) saved.add(id);
    }

    for (const file of photos) {
      const photo = await identifyFolderPhoto(fileId, file).catch(() => null);
      if (!runningRef.current) return;

      if (photo) {
        const message = saved.has(photo.assetId) ? null : await uploadFolderPhoto(fileId, file, photo.uploadKey);
        if (!runningRef.current) return;
        if (message) {
          failed.push({ file, message });
        } else {
          saved.add(photo.assetId);
          uploaded += 1;
        }
      } else {
        failed.push({ file, message: "Atlas could not read this photo. Choose the original folder to retry." });
      }
      setBatch({ total, uploaded, skipped, failed: [...failed], running: true });
    }

    runningRef.current = false;
    setConfirmedIds(saved);
    setBatch({ total, uploaded, skipped, failed, running: false });
    if (uploaded > alreadyUploaded) onUploaded();
    router.refresh();
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    const { photos, skipped } = selectFolderPhotos(files);
    void upload(photos, skipped);
  }

  return (
    <div className="ml-auto flex w-full max-w-full flex-wrap items-center gap-2 sm:w-auto sm:max-w-lg sm:justify-end">
      {children}
      <input hidden onChange={onPick} ref={inputRef} type="file" />
      <button
        className="atlas-btn atlas-btn-outline h-9 shrink-0 disabled:opacity-55"
        disabled={batch?.running}
        onClick={openPicker}
        type="button"
      >
        <FolderUpIcon aria-hidden="true" />
        Upload folder
      </button>
      {pickerError ? <Alert variant="destructive">{pickerError}</Alert> : null}
      <div aria-live="polite" className={batch ? "basis-full" : "sr-only"} role="status">
        {batch ? (
          <p className="text-sm">
            {batch.running
              ? `Uploading photos… ${batch.uploaded + batch.failed.length} of ${batch.total} processed. Keep this page open.`
              : batch.total
                ? `${batch.uploaded} of ${batch.total} photos saved.`
                : "No uploadable photos in this folder."}
            {!batch.running && batch.skipped
              ? ` Skipped ${batch.skipped} ${batch.skipped === 1 ? "file" : "files"}. Atlas skips empty or unsupported files and photos over 12 MB.`
              : null}
          </p>
        ) : null}
      </div>
      {batch && !batch.running && batch.failed.length ? (
        <div className="flex basis-full flex-wrap items-start gap-2">
          <button
            className="atlas-btn atlas-btn-outline h-9 shrink-0"
            onClick={() => void upload(batch.failed.map(({ file }) => file), batch.skipped, batch.uploaded)}
            type="button"
          >
            Retry failed uploads
          </button>
          <details className="min-w-0 flex-1 py-2 text-sm">
            <summary className="cursor-pointer">{batch.failed.length} failed</summary>
            <ul className="mt-2 list-disc pl-4">
              {batch.failed.map(({ file, message }) => (
                <li className="wrap-anywhere" key={file.webkitRelativePath || file.name}>{file.webkitRelativePath || file.name} · {message}</li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
      {needsFolder ? (
        <div className="flex basis-full flex-wrap items-center gap-2">
          <p className="text-sm">Choose the original folder to retry photos that still need uploading.</p>
          <button className="atlas-btn atlas-btn-outline h-9 shrink-0" onClick={openPicker} type="button">
            Retry failed uploads
          </button>
        </div>
      ) : null}
    </div>
  );
}
