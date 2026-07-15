import { notFound } from "next/navigation";

import { AtlasTopbar, splitFileTitle } from "@/features/files/components/file-ui";
import { ImageMetadataEditor } from "@/features/files/components/image-metadata-editor";
import { getFileAsset, getFileDetail, toFileAssetDto } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function ImageMetadataPage({ params }: { params: Promise<{ id: string; assetId: string }> }) {
  await requireAuth();
  const { id, assetId } = await params;
  const [detail, asset] = await Promise.all([getFileDetail(id), getFileAsset(id, assetId)]);
  if (!detail || !asset) notFound();
  const title = splitFileTitle(detail.file.title);

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: "var(--atlas-bg-root)", color: "var(--atlas-text-primary)" }}>
      <AtlasTopbar backHref={`/files/${id}/images`} current="Image details" fileName={title.name} />
      <ImageMetadataEditor asset={toFileAssetDto(asset)} fileId={id} />
    </div>
  );
}
