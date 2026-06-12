"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CameraIcon,
  ImageIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";

import { uploadFileImageAction } from "@/features/files/actions";
import { cn } from "@/lib/utils";
import {
  fileImageKindLabels,
  type FileImageKind,
} from "@/types/atlas";

type FileImagesPanelAsset = {
  id: string;
  kind: string;
  label: string;
  url: string;
  createdAt: number;
};

const imageBuckets: Array<{
  kind: FileImageKind;
  summary: string;
  detail: string;
  icon: typeof CameraIcon;
}> = [
  {
    kind: "site_visit",
    summary: "In-camera site photos",
    detail: "Upload site visit photos that should live with the site location tag.",
    icon: CameraIcon,
  },
  {
    kind: "ai_generated",
    summary: "Atlas Image outputs",
    detail: "Store generated concepts that should live with the image generation tag.",
    icon: SparklesIcon,
  },
];

function assetBelongsToBucket(asset: FileImagesPanelAsset, kind: FileImageKind) {
  if (kind === "site_visit") {
    return asset.kind === "site_visit" || asset.kind === "before_photo";
  }

  return asset.kind === kind;
}

export function FileImagesPanel({
  assets,
  fileId,
}: {
  assets: FileImagesPanelAsset[];
  fileId: string;
}) {
  const [activeKind, setActiveKind] = useState<FileImageKind>("site_visit");
  const visibleAssets = useMemo(
    () =>
      assets.filter(
        (asset) => asset.url && assetBelongsToBucket(asset, activeKind)
      ),
    [activeKind, assets]
  );
  const activeBucket = imageBuckets.find((bucket) => bucket.kind === activeKind);
  const uploadAction = uploadFileImageAction.bind(null, fileId, activeKind);

  return (
    <section className="atlas-simple-panel atlas-images-panel mt-4">
      <div className="atlas-simple-panel-head">
        <div>
          <h2>Site images</h2>
          <p className="atlas-muted">
            Keep site visit photos and generated concepts separated inside the file.
          </p>
        </div>
      </div>

      <div className="atlas-simple-panel-body">
        <div className="atlas-image-tabs" role="tablist" aria-label="Image categories">
          {imageBuckets.map((bucket) => {
            const Icon = bucket.icon;
            const count = assets.filter(
              (asset) => asset.url && assetBelongsToBucket(asset, bucket.kind)
            ).length;

            return (
              <button
                aria-selected={activeKind === bucket.kind}
                className={cn(
                  "atlas-image-tab",
                  activeKind === bucket.kind && "atlas-active"
                )}
                key={bucket.kind}
                onClick={() => setActiveKind(bucket.kind)}
                role="tab"
                type="button"
              >
                <Icon aria-hidden="true" />
                <span>
                  <strong>{fileImageKindLabels[bucket.kind]}</strong>
                  <small>
                    {count} {count === 1 ? "image" : "images"}
                  </small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="atlas-image-workspace">
          <div className="atlas-image-copy">
            <div className="atlas-pipeline-row-icon" aria-hidden="true">
              {activeKind === "site_visit" ? <CameraIcon /> : <SparklesIcon />}
            </div>
            <div>
              <h3>{activeBucket?.summary}</h3>
              <p>{activeBucket?.detail}</p>
            </div>
          </div>

          <form action={uploadAction} className="atlas-image-upload-form">
            <label>
              <span>Image label</span>
              <input
                name="label"
                placeholder={
                  activeKind === "site_visit"
                    ? "North wall before photo"
                    : "Warm oak concept"
                }
              />
            </label>
            <label>
              <span>Upload image</span>
              <input accept="image/*" name="image" required type="file" />
            </label>
            <button className="atlas-btn atlas-btn-primary" type="submit">
              <UploadIcon aria-hidden="true" />
              Upload
            </button>
          </form>
        </div>

        <div className="atlas-image-grid">
          {visibleAssets.map((asset) => (
            <figure className="atlas-image-card" key={asset.id}>
              <div className="atlas-image-frame">
                <Image
                  alt={asset.label}
                  height={280}
                  src={asset.url}
                  width={420}
                />
              </div>
              <figcaption>
                <ImageIcon aria-hidden="true" />
                <span>{asset.label}</span>
              </figcaption>
            </figure>
          ))}

          {visibleAssets.length === 0 ? (
            <div className="atlas-image-empty">
              <ImageIcon aria-hidden="true" />
              <strong>No images yet</strong>
              <span>
                Upload an image to start filling the{" "}
                {fileImageKindLabels[activeKind].toLowerCase()} bucket.
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
