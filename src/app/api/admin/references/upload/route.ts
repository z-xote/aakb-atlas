import { apiSuccess, withApiErrors } from "@/services/api/response";
import { uploadReferenceImage } from "@/features/references/data";
import { readReferenceUploadForm } from "@/features/references/schemas";
import { requireCliAdmin } from "@/services/auth/admin";

export async function POST(request: Request) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    const upload = await readReferenceUploadForm(await request.formData());
    const result = await uploadReferenceImage({ ...upload, createdBy: "cli-admin" });
    return apiSuccess(result, { status: 201 });
  });
}
