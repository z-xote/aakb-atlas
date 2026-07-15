import { ZodError, type ZodType } from "zod";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data } satisfies ApiSuccess<T>, init);
}

export function apiFailure(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      } satisfies ApiFailure,
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: "The request did not match the expected shape.",
          details: error.flatten(),
        },
      } satisfies ApiFailure,
      { status: 400 }
    );
  }

  console.error("Atlas API error", error);
  return Response.json(
    {
      ok: false,
      error: { code: "internal_error", message: "Atlas could not complete the request." },
    } satisfies ApiFailure,
    { status: 500 }
  );
}

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "invalid_json", "A valid JSON body is required.");
  }
  return schema.parse(body);
}

export async function withApiErrors(handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    return apiFailure(error);
  }
}
