import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3Icon,
  CalendarDaysIcon,
  FileTextIcon,
  ImageIcon,
  ImagesIcon,
  PlusIcon,
} from "lucide-react";

import {
  AtlasPill,
  AtlasTopbar,
  FileBottomNav,
  relationshipBadgeTone,
  relationshipShortLabel,
  splitFileTitle,
} from "@/features/files/components/file-ui";
import { getFileDetail } from "@/features/files/data";
import { pipelineDefinitions } from "@/features/pipelines/registry";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

const pipelineIcons = {
  atlas_image: ImageIcon,
  proposal: FileTextIcon,
  scheduler: CalendarDaysIcon,
  estimate_builder: BarChart3Icon,
  image_library: ImagesIcon,
};

export default async function PipelinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const detail = await getFileDetail(id);

  if (!detail) {
    notFound();
  }

  const title = splitFileTitle(detail.file.title);

  return (
    <main className="atlas-file-app atlas-has-bottom-nav">
      <AtlasTopbar backHref={`/files/${id}`} current="Pipelines" fileName={title.name} />

      <section className="atlas-pipelines-view">
        <div className="atlas-pipelines-heading">
          <div className="atlas-heading">
            <div className="atlas-eyebrow">File pipelines</div>
            <h1>Choose an action for {title.name}</h1>
            <p className="atlas-subtle">
              Each button opens a pipeline inside this file. The page is
              intentionally full-width so pipeline actions have room to breathe
              on iPad.
            </p>
          </div>
          <AtlasPill tone={relationshipBadgeTone(detail.file.relationshipStatus)}>
            {relationshipShortLabel(detail.file.relationshipStatus)}
          </AtlasPill>
        </div>

        <div className="atlas-pipeline-button-grid">
          {pipelineDefinitions.map((pipeline) => {
            const Icon = pipelineIcons[pipeline.key];
            const href =
              pipeline.key === "atlas_image"
                ? `/files/${id}/pipelines/atlas-image`
                : null;
            const content = (
              <>
                <span
                  className={cn(
                    "atlas-pipeline-action-icon",
                    pipeline.iconTone === "blue" && "atlas-pipeline-action-icon-blue",
                    pipeline.iconTone === "green" && "atlas-pipeline-action-icon-green",
                    pipeline.iconTone === "amber" && "atlas-pipeline-action-icon-amber"
                  )}
                >
                  <Icon />
                </span>
                <span className="atlas-pipeline-action-copy">
                  <strong>{pipeline.name}</strong>
                  <span>{pipeline.summary}</span>
                </span>
                <AtlasPill tone={pipeline.tone}>{pipeline.status}</AtlasPill>
              </>
            );

            if (href) {
              return (
                <Link
                  className="atlas-pipeline-action atlas-pipeline-action-primary"
                  href={href}
                  key={pipeline.key}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div className="atlas-pipeline-action" key={pipeline.key}>
                {content}
              </div>
            );
          })}

          <div className="atlas-pipeline-action atlas-pipeline-action-add">
            <span className="atlas-pipeline-action-icon">
              <PlusIcon />
            </span>
            <span className="atlas-pipeline-action-copy">
              <strong>Add custom pipeline</strong>
              <span>Create another action button for this file type later.</span>
            </span>
          </div>
        </div>
      </section>

      <FileBottomNav active="pipelines" fileId={id} />
    </main>
  );
}
