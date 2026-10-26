[FEATURE]: Manage references and categories in the catalog and the CLI
# v0.6.0 | Focus: Reference catalog

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Add an "Add reference" form to the Reference catalog. It has an image
   drop zone with a preview, a label, category chips and tag chips.

2. Add a "New category" chip. The category is created when the
   reference is saved, so a cancelled form leaves no empty category.

3. Add a Rename button on the selected category filter.

4. Add edit and delete buttons to each reference card. Edit opens the
   same form, filled in, and can replace the image.

5. Ask for confirmation before a delete, and name the reference.

6. Block the delete with 409 reference_in_use while an Atlas image
   session still uses the reference.

7. Remove a category when its last reference is deleted or moved out.

8. Add POST /api/references, PATCH and DELETE /api/references/[id],
   and PATCH /api/references/categories/[slug]. Each needs a signed-in
   session. Upload and edit accept newCategory in place of category.

9. Add matching admin routes and the CLI commands atlas references
   edit, atlas references delete and atlas references categories
   rename. categories create now works from --label alone.

10. Share the image checks between every reference route.

11. Update FINAL-SPEC.md so the catalog is no longer browse-only.

12. Add tests for the delete, edit, rename, new category and category
    clean-up services and for the auth guards.



## DESCRIPTION
-----------------------------------------------------------------------------
A signed-in user could only browse the Reference catalog. Adding,
changing or removing a reference needed the CLI and the admin token.
Categories could only be added through the CLI and never renamed.

The catalog page now has an Add reference form, a New category chip,
a Rename button for the selected category, and edit and delete buttons
on each card. After each action the page
calls router.refresh(), so the catalog updates without a full reload.

Every upload reuses the admin route's checks. It accepts image/* only,
up to 12 MB. The route records the session's device as created_by.
Delete removes the row and the stored file. A reference that an Atlas
image session still uses cannot be deleted, and the dialog says how
many sessions use it. Generations keep their own reference snapshot, so
they never block a delete.

A category disappears with its last reference, so nobody deletes
categories by hand. Categories that never had a reference stay. The
CLI offers the same operations, so an agent can do anything the page
does. Every signed-in user can make these changes, because Atlas has no
roles yet. VAR-27 may add them.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- Ticket VAR-29. It supersedes the browse-only rule in FINAL-SPEC.md
  sections 5.6, 6, 9, 12, 16 and 17.

- src/features/references/schemas.ts: readReferenceUploadForm()
  requires every field and an image. readReferenceEditForm() reads only
  the fields sent; an empty tags field clears the tags.
  categorySlug() turns a label into a slug. categoryCreateSchema now
  takes an optional slug and sortOrder.

- src/features/references/data.ts: resolveCategory() creates or reuses
  a named newCategory. If the upload then fails, the new category is
  dropped again. addReferenceCategory() appends after
  the highest sort_order. renameReferenceCategory() changes label and
  slug and refuses a taken slug. updateReferenceImage() keeps fields
  the edit leaves out. A new image goes under a new key, and the old
  object is removed after the row update. deleteReferenceImage()
  counts atlas_image_session_references rows first.
  dropCategoryIfEmpty() runs after a delete or a category move, and
  both results report categoryRemoved and storageRemoved.

- src/services/bunny/client.ts: deleteStoredObject() removes the local
  file or sends a Bunny DELETE. A 404 counts as removed.

- src/features/references/actor.ts: sessionActor() returns
  "device:<id>". The dev bypass session reports device "dev-local".

- src/features/references/reference-dialogs.tsx: ReferenceFormDialog
  serves add and edit. ImageDrop, CategoryPicker and TagInput live in
  the same file, with CategoryRenameDialog. Dialogs use a native
  <dialog> with showModal(). The catalog filters by category id, so a
  rename keeps the filter.

- src/app/references/page.tsx: the count line says "1 category" and
  "1 reference" in the singular.

- tests/references-crud.test.ts mocks next/headers with no cookie. It
  covers delete, linked delete, unknown ID, category slug and order,
  new category with a reference, cleanup after a failed upload,
  rename, category clean-up, partial edit, edit with a new image, and
  401 on every session route.

- Gate: bun run lint passes. bun run typecheck shows only the 6 known
  TS2307 bun:test errors, one per test file. The repo does not install
  @types/bun. bun test: 49 pass, 2 fail. The 2 failures are in
  milestone1.test.ts and fail the same way on a clean master. bun test
  runs every file in one process, so env.ts keeps the first file's env.

- Browser check on a throwaway database, port 3211: added a reference
  with a new category and tags, edited a label, renamed a category.
  Each refreshed in place with no server errors.

- CLI check against port 3211: categories create --label, upload, edit
  label and tags, edit --image, categories rename, edit --category
  that emptied and removed the old category, delete, and the usage
  error with exit code 3.

- Codex gpt-6.1 drove real Chrome through its Chrome plugin, not
  Computer Use. It passed the dialog layout, new category, tags, edit,
  close without saving, rename, duplicate rename, linked delete, move
  out, 820 and 400 px widths, reload and console steps. It could not
  attach files: its page evaluator has no fetch or DataTransfer.

- The file steps ran in the Claude browser pane instead: wrong type,
  over 12 MB, drop preview, add with a new category, cancel leaving
  no category, image swap with the old file gone, delete of the last
  reference with its category and file gone, move out, and reload.

- UNVERIFIED: a real drag from Finder, and the Bunny DELETE call
  against a real storage zone.


-----------------------------------------------------------------------------
