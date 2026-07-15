import { notFound } from "next/navigation";

import { AtlasTopbar, FileBottomNav, splitFileTitle } from "@/features/files/components/file-ui";
import { SiteImagesGallery } from "@/features/files/components/site-images-gallery";
import { getFileDetail, toFileAssetDto } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function SiteImagesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const detail = await getFileDetail(id);
  if (!detail) notFound();
  const title = splitFileTitle(detail.file.title);

  return (
    <main className="atlas-file-app atlas-has-bottom-nav">
      <AtlasTopbar backHref={`/files/${id}`} current="Site images" fileName={title.name} />
      <section className="atlas-detail-view flex flex-col gap-4">
        <div className="atlas-heading">
          <div className="atlas-eyebrow">File · Site images</div>
          <h1>{detail.file.title}</h1>
          <p className="atlas-subtle">Before photos and Atlas Image concepts that live on this file.</p>
        </div>
        <section className="atlas-simple-panel">
          <div className="atlas-simple-panel-head">
            <div><h2>Site images</h2><p className="atlas-muted">Keep site visit photos and generated concepts together in one place.</p></div>
            <span className="inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-bold" style={{ borderColor: "var(--atlas-border)", background: "var(--atlas-bg-muted)", color: "var(--atlas-text-secondary)" }}>{detail.assets.length} images</span>
          </div>
          <div className="atlas-simple-panel-body"><SiteImagesGallery assets={detail.assets.map(toFileAssetDto)} fileId={id} /></div>
        </section>
      </section>
      <FileBottomNav active="images" fileId={id} />
    </main>
  );
}
