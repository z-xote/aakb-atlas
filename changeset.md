[FEATURE]: Rename workflow stages to Site Visit, Design Concept, Proposal
# v0.8.0 | Focus: File wizard

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Rename the stage values before_photo to site_visit, image_concept to
   design_concept and proposal_needed to proposal.

2. Show the labels Site Visit, Design Concept and Proposal in the wizard,
   the edit form, file details, the pipelines page and the files list.

3. Move stored files to the new values when ensureDatabase() runs. The
   UPDATE runs on every start and changes nothing the second time.

4. Seed the sample file with design_concept.

5. Change the ready labels to "Site visit needed" and "Design concept
   ready". "Proposal needed" stays.

6. Add a test that maps the old values to the new ones and runs the
   migration twice.

7. List the relationship statuses and workflow stages in FINAL-SPEC.md.



## DESCRIPTION
-----------------------------------------------------------------------------
Step 3 of the new-file wizard offered Before photo, Image concept and
Proposal needed. Varshil wants the stages to read New file, Site Visit,
Design Concept, Proposal, Accepted and Archived.

This change renames the three stages in code and in the database.
Production already has files with the old values, so ensureDatabase()
moves them on the next start. Relationship statuses do not change. The
wizard still defaults to Prospect.



## TECHNICAL NOTES
-----------------------------------------------------------------------------
- src/types/atlas.ts: workflowStages and workflowStageLabels.
- src/db/client.ts: migrateWorkflowStages() runs one UPDATE per renamed
  stage, called in ensureDatabase() before the seed. The seed row uses
  design_concept.
- atlas-primitives.tsx: workflowReadyLabel() branches on the new values.
- src/app/mockup/mock-data.ts: the mock files use the new values.
- file-images-panel.tsx keeps before_photo and site_visit. Those are
  image kinds, a separate enum.
- tests/workflow-stage-migration.test.ts is new. milestone2 and
  milestone3 tests use the new values.
- v0.8.0: open PRs #5 and #6 both claim v0.6.0, so one of them takes
  v0.7.0 and this change takes the next free version.
- Gate: typecheck shows only the known "bun:test" errors, lint is clean,
  bun test shows 29 pass and the 2 known Milestone 1 failures.
- UNVERIFIED: the screens were not checked in a browser.


-----------------------------------------------------------------------------
