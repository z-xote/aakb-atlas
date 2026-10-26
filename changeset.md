[FEATURE]: Add and delete references from the Reference catalog page
# v0.5.0 | Focus: Reference catalog

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Add an "Add reference" button and form to the Reference catalog. The
   form takes an image, a label, an existing category and tags.

2. Add a delete button to each reference card. A confirm dialog names the
   reference before the delete runs.

3. Add POST /api/references and DELETE /api/references/[id]. Both need a
   signed-in session and return 401 without one.

4. Add deleteReferenceImage() in src/features/references/data.ts. It
   removes the row, then the stored object at storage_key.

5. Block the delete with 409 reference_in_use while an Atlas image
   session still uses the reference.

6. Move the upload form checks into readReferenceUploadForm() so the
   admin route and the session route apply the same limits.

7. Add DELETE /api/admin/references/[id] and the CLI command
   atlas references delete <id>.

8. Update FINAL-SPEC.md so the catalog is no longer browse-only.

9. Add tests for the delete service and for the auth guards.



## DESCRIPTION
-----------------------------------------------------------------------------
A signed-in user could only browse the Reference catalog. Adding or
removing a reference needed the CLI and the admin token.

The catalog page now has an Add reference form and a delete button on
each card. After either action the page calls router.refresh(), so the
catalog updates without a full reload.

The upload reuses uploadReferenceImage() and the admin route's checks. It
accepts image/* only, up to 12 MB. The route records the session's
device as created_by. Delete is a hard delete of the row and the stored
file. A reference that an Atlas image session still uses cannot be
deleted. The dialog says how many sessions use it. Generations keep their
own reference snapshot, so they never block a delete.

Category creation stays in the CLI. Every signed-in user can add and
delete, because Atlas has no roles yet. VAR-27 may add them.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- Ticket VAR-29. It supersedes the browse-only rule in FINAL-SPEC.md
  sections 5.6, 6, 9, 12, 16 and 17.

- src/features/references/schemas.ts: readReferenceUploadForm() and
  MAX_REFERENCE_UPLOAD_BYTES. The admin upload route now calls it.

- src/features/references/data.ts: deleteReferenceImage(id, remover)
  counts atlas_image_session_references rows first. The row goes before
  the object, so a storage failure leaves an orphaned file and a log
  line, never a broken card. The result carries storageRemoved.

- src/services/bunny/client.ts: deleteStoredObject() removes the local
  file or sends a Bunny DELETE. A 404 counts as removed.

- src/features/references/actor.ts: sessionActor() gives "device:<id>",
  or "dev" for the next dev login bypass. This change leaves session.ts
  alone.

- src/features/references/reference-dialogs.tsx: AddReferenceDialog and
  DeleteReferenceDialog use a native <dialog> with showModal().

- tests/references-crud.test.ts mocks next/headers with no cookie. It
  covers unlinked delete, linked delete blocked, unknown ID, and
  rejection on the session upload, session delete and admin delete.

- Gate: bun run lint passes. bun run typecheck shows only the 5 known
  TS2307 bun:test errors, one per test file. The repo does not install
  @types/bun. bun test: 30 pass, 2 fail. The 2 failures are in
  milestone1.test.ts and fail the same way on a clean master. bun test
  runs every file in one process, so env.ts keeps the first file's env.

- UNVERIFIED: nobody opened the dialogs in a browser. Nobody ran the
  Bunny DELETE call against a real storage zone.


-----------------------------------------------------------------------------
