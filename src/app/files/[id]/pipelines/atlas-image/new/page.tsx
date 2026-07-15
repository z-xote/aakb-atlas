import { notFound } from "next/navigation";

import { AtlasImageSourceSelection } from "@/features/atlas-image/components/source-selection";
import { AtlasTopbar, splitFileTitle } from "@/features/files/components/file-ui";
import { getFileDetail, toFileAssetDto } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function AtlasImageSourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ select?: string }> }) {
  await requireAuth();
  const { id } = await params;
  const { select } = await searchParams;
  const detail = await getFileDetail(id);
  if (!detail) notFound();
  const assets = detail.assets.filter((asset) => asset.status === "ready" && Boolean(asset.url)).map(toFileAssetDto);
  const title = splitFileTitle(detail.file.title);
  return <main className="atlas-file-app atlas-has-bottom-nav"><AtlasTopbar backHref={`/files/${id}/pipelines/atlas-image`} current="Atlas Image" fileName={title.name} /><AtlasImageSourceSelection assets={assets} fileId={id} initialSelection={select} /></main>;
}
