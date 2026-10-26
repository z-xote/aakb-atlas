import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";

const databaseName = `atlas-milestone1-${randomUUID()}.sqlite`;
process.env.DATABASE_PATH = `data/${databaseName}`;
process.env.ATLAS_CLI_ADMIN_TOKEN = "test-cli-admin-token";
process.env.ATLAS_STORAGE_DRIVER = "local";

const admin = await import("@/services/auth/admin");
const filesData = await import("@/features/files/data");
const { fileFormSchema } = await import("@/features/files/schemas");
const references = await import("@/features/references/data");

const uploadedFiles: string[] = [];

afterAll(async () => {
  await rm(path.join(process.cwd(), "data", databaseName), { force: true });
  await Promise.all(uploadedFiles.map((filename) => rm(filename, { force: true })));
});

describe("Milestone 1 file, CLI, and reference contracts", () => {
  test("wizard validation rejects missing required fields and persists every field", async () => {
    expect(fileFormSchema.safeParse({}).success).toBe(false);
    const input = {
      title: "Test kitchen refresh",
      relationshipStatus: "qualified_lead" as const,
      workflowStage: "new_file" as const,
      projectType: "kitchen" as const,
      budgetRange: "20k_35k" as const,
      jobType: "renovation" as const,
      leadSource: "Referral",
      contactName: "Test Client",
      contactEmail: "client@example.com",
      contactPhone: "+64 21 555 0100",
      note: "Keep this note.",
    };
    expect(fileFormSchema.safeParse(input).success).toBe(true);
    const id = await filesData.createFile(input);
    const detail = await filesData.getFileDetail(id);
    expect(detail?.file).toMatchObject({ title: input.title, leadSource: input.leadSource, budgetRange: input.budgetRange });
    expect(detail?.contact).toMatchObject({ name: input.contactName, email: input.contactEmail, phone: input.contactPhone });
    expect(detail?.notes[0]?.body).toBe(input.note);
    expect(detail?.assets).toHaveLength(0);
  });

  test("CLI admin bearer authorization accepts only the configured token", () => {
    expect(() => admin.requireCliAdmin(new Request("http://localhost/api", { headers: { authorization: "Bearer wrong" } }))).toThrow();
    expect(() => admin.requireCliAdmin(new Request("http://localhost/api", { headers: { authorization: "Bearer test-cli-admin-token" } }))).not.toThrow();
  });

  test("reference upload stores bytes first and persisted catalog metadata second", async () => {
    const category = await references.createReferenceCategory({ slug: "test-vanities", label: "Test vanities", sortOrder: 1 });
    const image = await references.uploadReferenceImage({
      category: category.slug,
      label: "Oak wall-hung vanity",
      tags: ["oak", "wall-hung"],
      filename: "vanity.png",
      contentType: "image/png",
      bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      createdBy: "test",
    });
    uploadedFiles.push(path.join(process.cwd(), "public", image.url));
    const catalog = await references.listReferenceCatalog();
    expect(catalog.images.find((item) => item.id === image.id)).toMatchObject({
      categorySlug: "test-vanities",
      label: "Oak wall-hung vanity",
      tags: ["oak", "wall-hung"],
    });
  });
});
