"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownRightIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import { createClientRequestId, generationFailureMessage, readGenerationResponse } from "@/features/atlas-image/client-request";

export function GenerationAutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => router.refresh(), 2_000);
    return () => window.clearInterval(timer);
  }, [active, router]);
  return null;
}

export function ContinueGenerationButton({ fileId, generationId }: { fileId: string; generationId: string }) {
  const router = useRouter();
  async function continueEditing() {
    const response = await fetch(`/api/files/${fileId}/atlas-image/generations/${generationId}/continue`, { method: "POST" });
    const body = (await response.json()) as { ok: boolean; data?: { id?: string } };
    if (response.ok && body.ok && body.data?.id) router.push(`/files/${fileId}/pipelines/atlas-image/workspace/${body.data.id}`);
  }
  return <button className="atlas-bottom-nav-item atlas-active" onClick={() => void continueEditing()} type="button"><CornerDownRightIcon className="size-4" />Continue editing</button>;
}

export function RetryGenerationButton({ fileId, generationId, label = "Retry generation" }: { fileId: string; generationId: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function retry() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/files/${fileId}/atlas-image/generations/${generationId}/retry`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientRequestId: createClientRequestId() }) });
      const body = await readGenerationResponse(response);
      if (response.ok && body?.ok && body.data?.id) {
        router.push(`/files/${fileId}/pipelines/atlas-image/generations/${body.data.id}`);
        router.refresh();
        return;
      }
      toast.error(generationFailureMessage(response, body));
    } catch {
      toast.error("Atlas could not reach the server to retry. Check the connection and try again.");
    }
    setBusy(false);
  }
  return <button aria-busy={busy} className="atlas-bottom-nav-item atlas-active" disabled={busy} onClick={() => void retry()} type="button"><RotateCcwIcon className={busy ? "size-4 animate-spin" : "size-4"} />{busy ? "Generating…" : label}</button>;
}
