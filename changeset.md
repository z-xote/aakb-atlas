[FEATURE]: Upload a folder of site photos in one go
# v0.10.0 | Focus: Site images

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Add Upload folder beside Add and send eligible photos to Bunny.

2. Match each photo by its relative path and bytes within the Atlas file.

3. Retry failed photos after a reload and skip photos already saved.



## DESCRIPTION
-----------------------------------------------------------------------------
Site staff can select a folder once to upload photos from it and its
subfolders. Atlas uses the filenames as labels, leaves rooms unset, and
skips empty files, unsupported files, and photos over 12 MiB.

If an upload fails, select the original folder after a reload. Atlas
retries the photo against its existing record and skips saved photos.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- The asset route hashes the submitted bytes with the relative-path
  digest. The browser computes the same ID and checks gallery status
  before sending bytes. The 32-character preview keys remain valid.

- Typecheck, lint, and all 68 tests pass with `bun run test`. Plain
  `bun test` has two baseline failures from shared test settings.

- Chrome and WebKit exercised reload, in-tab retry, a lost response, and
  a 12 MiB photo with the real asset handler and simulated Bunny. After
  reload, one retry kept all three SQLite IDs. A repeat sent no uploads.

- A single PNG returned HTTP 201, matched the local storage bytes, and
  stayed ready after reopening SQLite.

- The live Atlas nginx site now has a 13 MiB request limit. Over public
  HTTPS, a 12 MiB multipart file reached Atlas and returned the expected
  signed-out HTTP 401. A 14 MiB file still returned HTTP 413.

- Retest on a fresh Atlas file. Photos saved by preview commit 44d7c08
  used random keys and have no stable folder identity.

- UNVERIFIED: signed-in live Bunny uploads, the native iPad picker, and
  the production build.


-----------------------------------------------------------------------------
