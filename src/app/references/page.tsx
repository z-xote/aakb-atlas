import { AtlasTopbar } from "@/features/files/components/file-ui";
import { listReferenceCatalog } from "@/features/references/data";
import { ReferenceCatalog } from "@/features/references/reference-catalog";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function ReferencesPage() {
  await requireAuth();
  const catalog = await listReferenceCatalog();
  return (
    <main className="atlas-file-app">
      <AtlasTopbar backHref="/files" current="Reference catalog" />
      <section className="atlas-files-view">
        <div className="atlas-files-heading">
          <div className="atlas-heading">
            <h1>Reference catalog</h1>
            <p className="atlas-subtle">{catalog.images.length} references · {catalog.categories.length} categories · curated inputs shared across every file.</p>
          </div>
        </div>
        <ReferenceCatalog {...catalog} />
      </section>
    </main>
  );
}
