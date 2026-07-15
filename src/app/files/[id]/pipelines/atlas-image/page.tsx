import { notFound } from "next/navigation";

import { listAtlasImageHistory } from "@/features/atlas-image/data";
import { AtlasImageHistory } from "@/features/atlas-image/components/history";
import { AtlasTopbar, splitFileTitle } from "@/features/files/components/file-ui";
import { getFileDetail } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function AtlasImagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const detail = await getFileDetail(id);
  if (!detail) notFound();
  const history = await listAtlasImageHistory(id);
  const title = splitFileTitle(detail.file.title);
  return <main className="atlas-file-app atlas-has-bottom-nav"><AtlasTopbar backHref={`/files/${id}/pipelines`} current="Atlas Image" fileName={title.name} /><AtlasImageHistory fileId={id} history={history} /></main>;
}
