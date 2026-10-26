[FEATURE]: Add, edit and delete references and categories in the catalog
# v0.6.0 | Focus: Reference catalog

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Add an "Add reference" form to the Reference catalog. It has an image
   drop zone with a preview, a label, category chips and tag chips.

2. Add a "New category" chip that creates a category from a name.

3. Add edit and delete buttons to each reference card. Edit opens the
   same form, filled in, and can replace the image.

4. Ask for confirmation before a delete, and name the reference.

5. Block the delete with 409 reference_in_use while an Atlas image
   session still uses the reference.

6. Add POST /api/references, PATCH and DELETE /api/references/[id], and
   POST /api/references/categories. Each needs a signed-in session.

7. Move the form checks into readReferenceForm() so every reference
   route applies the same type and size limits.

8. Add DELETE /api/admin/references/[id] and the CLI command
   atlas references delete <id>.

9. Update FINAL-SPEC.md so the catalog is no longer browse-only.

10. Add tests for the delete, edit and category services and for the
    auth guards.



## DESCRIPTION
-----------------------------------------------------------------------------
A signed-in user could only browse the Reference catalog. Adding,
changing or removing a reference needed the CLI and the admin token.
There was no way to add a category at all outside the CLI.

The catalog page now has an Add reference form, a New category chip,
and edit and delete buttons on each card. After each action the page
calls router.refresh(), so the catalog updates without a full reload.

Every upload reuses the admin route's checks. It accepts image/* only,
up to 12 MB. The route records the session's device as created_by.
Delete removes the row and the stored file. A reference that an Atlas
image session still uses cannot be deleted, and the dialog says how
many sessions use it. Generations keep their own reference snapshot, so
they never block a delete.

Categories cannot be renamed or deleted yet. Every signed-in user can
add, edit and delete, because Atlas has no roles yet. VAR-27 may add
them.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- Ticket VAR-29. It supersedes the browse-only rule in FINAL-SPEC.md
  sections 5.6, 6, 9, 12, 16 and 17.

- src/features/references/schemas.ts: readReferenceForm() reads an
  optional image. readReferenceUploadForm() requires one.
  categorySlug() turns a label into a slug.

- src/features/references/data.ts: addReferenceCategory() appends after
  the highest sort_order. updateReferenceImage() stores a new image
  under a new key and removes the old object after the row update.
  deleteReferenceImage() counts atlas_image_session_references rows
  first. Both removals log and report storageRemoved on failure.

- src/services/bunny/client.ts: deleteStoredObject() removes the local
  file or sends a Bunny DELETE. A 404 counts as removed.

- src/features/references/actor.ts: sessionActor() returns
  "device:<id>". The dev bypass session reports device "dev-local".

- src/features/references/reference-dialogs.tsx: ReferenceFormDialog
  serves add and edit. ImageDrop, CategoryPicker and TagInput live in
  the same file. Dialogs use a native <dialog> with showModal().

- tests/references-crud.test.ts mocks next/headers with no cookie. It
  covers delete, linked delete, unknown ID, category slug and order,
  edit with and without a new image, and 401 on every session route.

- Gate: bun run lint passes. bun run typecheck shows only the 6 known
  TS2307 bun:test errors, one per test file. The repo does not install
  @types/bun. bun test: 39 pass, 2 fail. The 2 failures are in
  milestone1.test.ts and fail the same way on a clean master. bun test
  runs every file in one process, so env.ts keeps the first file's env.

- Browser check on a throwaway database, port 3211: added a reference
  with a new category and tags, then edited its label. Both refreshed
  in place with no console errors.

- UNVERIFIED: real drag and drop from Finder, delete of a linked
  reference in the browser, and the Bunny DELETE call against a real
  storage zone.


-----------------------------------------------------------------------------
