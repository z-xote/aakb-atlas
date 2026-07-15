import { notFound } from "next/navigation";

import { PhotoCapture } from "@/features/files/components/photo-capture";
import { getFileDetail } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function CapturePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; returnTo?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { mode, returnTo } = await searchParams;
  const detail = await getFileDetail(id);
  if (!detail) notFound();

  const safeReturnTo = returnTo?.startsWith(`/files/${id}/pipelines/atlas-image/new`)
    ? returnTo
    : undefined;
  return <PhotoCapture fileId={id} fileTitle={detail.file.title} initialMode={mode === "upload" ? "upload" : "camera"} returnTo={safeReturnTo} />;
}
