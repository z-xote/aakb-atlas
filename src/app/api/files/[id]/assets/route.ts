import { uploadFileAsset } from "@/features/files/data";
import {
  fileAssetContentType,
  fileAssetUploadFieldsSchema,
  MAX_FILE_ASSET_BYTES,
} from "@/features/files/schemas";
import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";

function requiredText(form: FormData, key: string) {
  return String(form.get(key) ?? "");
}

function optionalText(form: FormData, key: string) {
  const value = requiredText(form, key).trim();
  return value || null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) {
      throw new ApiError(401, "unauthorized", "Unlock Atlas before uploading images.");
    }

    const { id } = await params;
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File) || image.size === 0) {
      throw new ApiError(400, "image_required", "Choose an image to upload.");
    }
    const contentType = fileAssetContentType(image);
    if (!contentType) {
      throw new ApiError(400, "invalid_image_type", "Choose a JPEG, PNG, WebP, HEIC, or HEIF image.");
    }
    if (image.size > MAX_FILE_ASSET_BYTES) {
      throw new ApiError(413, "image_too_large", "Images must be 12 MB or smaller.");
    }

    let tags: unknown = [];
    try {
      tags = JSON.parse(requiredText(form, "tags") || "[]");
    } catch {
      throw new ApiError(400, "invalid_tags", "Image tags must be a JSON array.");
    }
    const fields = fileAssetUploadFieldsSchema.parse({
      label: requiredText(form, "label"),
      room: optionalText(form, "room"),
      origin: requiredText(form, "origin"),
      cameraPositionClock: optionalText(form, "cameraPositionClock"),
      retryAssetId: optionalText(form, "retryAssetId"),
      tags,
    });
    const asset = await uploadFileAsset({
      ...fields,
      fileId: id,
      origin: fields.origin as "camera" | "upload",
      filename: image.name,
      contentType,
      bytes: new Uint8Array(await image.arrayBuffer()),
    });
    return apiSuccess(asset, { status: 201 });
  });
}
