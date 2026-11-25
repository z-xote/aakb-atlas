"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { FolderUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { selectFolderPhotos, uploadFolderPhoto, type FolderPhoto } from "@/features/files/folder-upload";

type FailedPhoto = FolderPhoto & { message: string };
type Batch = {
  total: number;
  uploaded: number;
  skipped: number;
  failed: FailedPhoto[];
  running: boolean;
};

export function FolderUpload({
  children,
  fileId,
  onUploaded,
}: {
  children: ReactNode;
  fileId: string;
  onUploaded: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const runningRef = useRef(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [pickerError, setPickerError] = useState("");

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

  async function upload(photos: FolderPhoto[], skipped: number, alreadyUploaded = 0) {
    if (runningRef.current) return;
    runningRef.current = photos.length > 0;
    const total = photos.length + alreadyUploaded;
    let uploaded = alreadyUploaded;
    const failed: FailedPhoto[] = [];
    setBatch({ total, uploaded, skipped, failed, running: runningRef.current });
    if (!photos.length) return;

    for (const photo of photos) {
      const message = await uploadFolderPhoto(fileId, photo);
      if (!runningRef.current) return;
      if (message) failed.push({ ...photo, message });
      else uploaded += 1;
      setBatch({ total, uploaded, skipped, failed: [...failed], running: true });
    }

    runningRef.current = false;
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
                ? `Uploaded ${batch.uploaded} of ${batch.total} photos.`
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
            onClick={() => void upload(batch.failed, batch.skipped, batch.uploaded)}
            type="button"
          >
            Retry failed uploads
          </button>
          <details className="min-w-0 flex-1 py-2 text-sm">
            <summary className="cursor-pointer">{batch.failed.length} failed</summary>
            <ul className="mt-2 list-disc pl-4">
              {batch.failed.map(({ file, message, uploadKey }) => (
                <li className="wrap-anywhere" key={uploadKey}>{file.webkitRelativePath || file.name} · {message}</li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
    </div>
  );
}
