[FEATURE]: Upload a folder of site photos in one go
# v0.10.0 | Focus: Site images

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Add Upload folder beside Add in empty and populated galleries.

2. Upload eligible photos in subfolders through Atlas to Bunny.

3. Show progress and retry failed photos without creating duplicate assets.



## DESCRIPTION
-----------------------------------------------------------------------------
Site staff often have a folder of visit photos ready to share. They can
now select that folder once. Atlas uses the filenames as labels, leaves
rooms unset, and skips empty files, unsupported files, and photos over
12 MB.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- The existing asset route accepts an upload key. Repeated requests for
  the same photo reuse its SQLite record and Bunny object path.

- Typecheck, lint, and all 66 tests pass with `bun run test`. The test
  script isolates each file. Plain `bun test` has two baseline failures
  because test files share storage and authentication settings.

- Chrome sent a nested folder through the real asset handler and SQLite
  with simulated Bunny responses. It retried a rejected upload and a lost
  response and rendered the three retained photos at 320 to 1280 pixels.

- Production nginx returned HTTP 413 for an upload-sized request. Set
  `client_max_body_size 13m;` in the Atlas site before release.

- UNVERIFIED: live Bunny upload, native iPad picker, and production build.


-----------------------------------------------------------------------------
