import Link from "next/link";
import { notFound } from "next/navigation";
import { CloudUploadIcon, ImageIcon, SparklesIcon } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFileDetail } from "@/features/files/data";
import { createBunnyUploadSlot } from "@/services/bunny/client";
import { createAtlasImagePromptPlan } from "@/services/openai/client";
import { requireAuth } from "@/services/auth/session";
import { projectTypeLabels } from "@/types/atlas";

export const dynamic = "force-dynamic";

export default async function AtlasImagePage({
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

  const bunnySlot = createBunnyUploadSlot({
    fileId: id,
    filename: "before-photo.jpg",
  });
  const promptPlan = createAtlasImagePromptPlan({
    projectType: projectTypeLabels[detail.file.projectType],
    note: detail.notes[0]?.body,
  });

  return (
    <AppShell
      title={detail.file.title}
      eyebrow="Atlas Image"
      backHref={`/files/${id}/pipelines`}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">Atlas Image</h1>
        <p className="text-sm text-muted-foreground">
          Placeholder shell. Real generation waits.
        </p>
      </div>

      <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle>Before to after lane</CardTitle>
            <CardDescription>
              File asset rows and service boundaries are ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <PipelineSlot
              icon={<ImageIcon />}
              title="Before photo"
              badge="Asset slot"
              body={bunnySlot.objectPath}
            />
            <PipelineSlot
              icon={<SparklesIcon />}
              title="After concept"
              badge="Deferred"
              body={promptPlan.prompt}
            />
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle>Service checks</CardTitle>
            <CardDescription>Named homes exist. Env controls wiring.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ServiceRow
              icon={<CloudUploadIcon />}
              name="Bunny"
              configured={bunnySlot.configured}
              path="src/services/bunny"
            />
            <ServiceRow
              icon={<SparklesIcon />}
              name="OpenAI"
              configured={promptPlan.configured}
              path="src/services/openai"
            />
            <Link
              href={`/files/${id}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Back to file
            </Link>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function PipelineSlot({
  icon,
  title,
  badge,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  badge: string;
  body: string;
}) {
  return (
    <div className="flex min-h-48 flex-col justify-between gap-4 rounded-lg border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-medium">{title}</h2>
        </div>
        <Badge variant="secondary">{badge}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ServiceRow({
  icon,
  name,
  configured,
  path,
}: {
  icon: React.ReactNode;
  name: string;
  configured: boolean;
  path: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{path}</p>
        </div>
      </div>
      <Badge variant={configured ? "default" : "outline"}>
        {configured ? "Configured" : "Env empty"}
      </Badge>
    </div>
  );
}
