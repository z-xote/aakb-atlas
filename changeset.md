[FIX]: Support iPad voice transcription formats
# v0.2.0 | Focus: Atlas voice recording compatibility

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Preserve the audio container selected by each browser.

2. Detect uploaded audio containers before provider submission.

3. Add older iPad capture fallback and format regression tests.



## DESCRIPTION
-----------------------------------------------------------------------------
Fix voice transcription on iPad by sending MP4 and AAC recordings with
matching MIME types and filenames. Keep WebM and other supported browser
formats working, and fall back to native audio capture on older iPads.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- Added shared format negotiation and byte detection in audio.ts.

- Updated the workspace recorder to prefer AAC in MP4 on Safari.

- The transcription route now distrusts client file extensions.

- Added tests for MP4, WebM, Ogg, WAV, FLAC, and MP3 detection.


-----------------------------------------------------------------------------
