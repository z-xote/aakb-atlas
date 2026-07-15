import { uploadAtlasImageSessionReference } from "@/features/atlas-image/data";
import { fileAssetContentType, MAX_FILE_ASSET_BYTES } from "@/features/files/schemas";
import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas first.");
    const { id, sessionId } = await params;
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File) || image.size === 0) {
      throw new ApiError(400, "image_required", "Choose an image reference to upload.");
    }
    const contentType = fileAssetContentType(image);
    if (!contentType) {
      throw new ApiError(400, "invalid_image_type", "Choose a JPEG, PNG, WebP, HEIC, or HEIF image.");
    }
    if (image.size > MAX_FILE_ASSET_BYTES) {
      throw new ApiError(413, "image_too_large", "Reference images must be 12 MB or smaller.");
    }
    const label = image.name.replace(/\.[^.]+$/, "").trim().slice(0, 80) || "Uploaded reference";
    return apiSuccess(await uploadAtlasImageSessionReference({
      fileId: id,
      sessionId,
      label,
      filename: image.name,
      contentType,
      bytes: new Uint8Array(await image.arrayBuffer()),
    }), { status: 201 });
  });
}
