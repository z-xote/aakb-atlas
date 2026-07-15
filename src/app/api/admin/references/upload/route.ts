import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { uploadReferenceImage } from "@/features/references/data";
import { parseTags, referenceUploadFieldsSchema } from "@/features/references/schemas";
import { requireCliAdmin } from "@/services/auth/admin";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    const form = await request.formData();
    const fields = referenceUploadFieldsSchema.parse({
      category: form.get("category"),
      label: form.get("label"),
      tags: form.get("tags") ?? "",
    });
    const image = form.get("image");
    if (!(image instanceof File) || image.size === 0) {
      throw new ApiError(400, "image_required", "A reference image file is required.");
    }
    if (!image.type.startsWith("image/")) {
      throw new ApiError(400, "invalid_image_type", "The uploaded reference must be an image.");
    }
    if (image.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(413, "image_too_large", "Reference images must be 12 MB or smaller.");
    }
    const result = await uploadReferenceImage({
      ...fields,
      tags: parseTags(fields.tags),
      filename: image.name,
      contentType: image.type,
      bytes: new Uint8Array(await image.arrayBuffer()),
      createdBy: "cli-admin",
    });
    return apiSuccess(result, { status: 201 });
  });
}
