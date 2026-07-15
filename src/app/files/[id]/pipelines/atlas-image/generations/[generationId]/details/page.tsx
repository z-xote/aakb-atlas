import { notFound } from "next/navigation";

import { AtlasImageGenerationDetails } from "@/features/atlas-image/components/generation-view";
import { getAtlasImageGenerationDetail, getAtlasImageLineage } from "@/features/atlas-image/data";
import { AtlasTopbar, splitFileTitle } from "@/features/files/components/file-ui";
import { getFileDetail } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function GenerationDetailsPage({ params }: { params: Promise<{ id: string; generationId: string }> }) {
  await requireAuth();
  const { id, generationId } = await params;
  const [detail, generation, lineage] = await Promise.all([getFileDetail(id), getAtlasImageGenerationDetail(id, generationId), getAtlasImageLineage(id, generationId)]);
  if (!detail || !generation) notFound();
  const title = splitFileTitle(detail.file.title);
  return <main className="atlas-file-app atlas-has-bottom-nav"><AtlasTopbar backHref={`/files/${id}/pipelines/atlas-image/generations/${generationId}`} current="Atlas Image" fileName={title.name} /><AtlasImageGenerationDetails fileId={id} generation={generation} lineage={lineage} /></main>;
}
