import { notFound } from "next/navigation";

import { getAtlasImageSession } from "@/features/atlas-image/data";
import { AtlasImageWorkspace } from "@/features/atlas-image/components/workspace";
import { AtlasTopbar, splitFileTitle } from "@/features/files/components/file-ui";
import { getFileDetail } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";
import { getOpenAIEnv } from "@/services/openai/env";

export const dynamic = "force-dynamic";

export default async function AtlasImageWorkspacePage({ params }: { params: Promise<{ id: string; sessionId: string }> }) {
  await requireAuth();
  const { id, sessionId } = await params;
  const [detail, session] = await Promise.all([getFileDetail(id), getAtlasImageSession(id, sessionId)]);
  if (!detail || !session) notFound();
  const title = splitFileTitle(detail.file.title);
  return <main className="atlas-file-app atlas-has-bottom-nav"><AtlasTopbar backHref={`/files/${id}/pipelines/atlas-image`} current="Atlas Image" fileName={title.name} /><AtlasImageWorkspace defaultQuality={getOpenAIEnv().quality} fileId={id} initialDirections={session.directions} initialReferenceIds={session.references.map((reference) => reference.id)} references={session.catalog.images} sessionId={sessionId} source={session.source} /></main>;
}
