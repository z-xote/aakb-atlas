"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CornerDownRightIcon, RotateCcwIcon } from "lucide-react";

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
  async function retry() {
    const response = await fetch(`/api/files/${fileId}/atlas-image/generations/${generationId}/retry`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientRequestId: crypto.randomUUID() }) });
    const body = (await response.json()) as { ok: boolean; data?: { id?: string } };
    if (response.ok && body.ok && body.data?.id) { router.push(`/files/${fileId}/pipelines/atlas-image/generations/${body.data.id}`); router.refresh(); }
  }
  return <button className="atlas-bottom-nav-item atlas-active" onClick={() => void retry()} type="button"><RotateCcwIcon className="size-4" />{label}</button>;
}
