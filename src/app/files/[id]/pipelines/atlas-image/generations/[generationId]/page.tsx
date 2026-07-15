import { notFound } from "next/navigation";

import { AtlasImageGenerationOverview } from "@/features/atlas-image/components/generation-view";
import { getAtlasImageGenerationDetail } from "@/features/atlas-image/data";
import { AtlasTopbar, splitFileTitle } from "@/features/files/components/file-ui";
import { getFileDetail } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function GenerationPage({ params }: { params: Promise<{ id: string; generationId: string }> }) {
  await requireAuth();
  const { id, generationId } = await params;
  const [detail, generation] = await Promise.all([getFileDetail(id), getAtlasImageGenerationDetail(id, generationId)]);
  if (!detail || !generation) notFound();
  const title = splitFileTitle(detail.file.title);
  return <main className="atlas-file-app atlas-has-bottom-nav"><AtlasTopbar backHref={`/files/${id}/pipelines/atlas-image`} current="Atlas Image" fileName={title.name} /><AtlasImageGenerationOverview fileId={id} generation={generation} /></main>;
}
