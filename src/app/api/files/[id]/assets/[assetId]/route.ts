import { updateFileAssetMetadata } from "@/features/files/data";
import { fileAssetMetadataSchema } from "@/features/files/schemas";
import { ApiError, apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) {
      throw new ApiError(401, "unauthorized", "Unlock Atlas before editing image metadata.");
    }
    const { id, assetId } = await params;
    const input = await parseJson(request, fileAssetMetadataSchema);
    return apiSuccess(await updateFileAssetMetadata(id, assetId, input));
  });
}
