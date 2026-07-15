# Atlas v0.2 implementation handoff

This folder is the complete Atlas v0.2 implementation handoff. A capable implementation model can receive the entire folder, but it must execute the three milestone packets in order and stop for human testing after each one.

## Source of truth

Read [FINAL-SPEC.md](./FINAL-SPEC.md) first. It owns the product, data, API, storage, security, navigation, and release boundaries.

The mockups under `src/app/mockup/` own visual hierarchy and user-visible states. Production code must use real persisted data and must preserve the existing production top navigation.

## Execution order

1. [Foundation, authentication, new file, and Reference Catalog](./01-foundation-auth-new-file-reference-catalog/packet.md)
2. [File Details and Site Images](./02-file-details-and-site-images/packet.md)
3. [Atlas Image pipeline](./03-atlas-image-pipeline/packet.md)

Each packet is one independently testable implementation goalpost. Execute only one packet at a time.

## Mandatory stop gates

- Finish the active packet's automated verification.
- Present its **Human gate** checklist to the user.
- Write the required `report.md` beside that packet.
- Until the human test passes, report `PARTIAL`; do not call the milestone achieved.
- Do not create your own approval.
- After the user explicitly approves, the orchestrator records `APPROVED` in `approval.md` beside the completed packet.
- The next packet's Start State requires the previous report and approval file.

## Critical invariants

- Do not redesign or replace the production `AtlasTopbar`.
- Reuse the production sticky bottom-navigation pattern throughout the multi-stage flows.
- Desktop and iPad landscape are the release-quality targets; phone/portrait is graceful fallback only.
- Reference Catalog is browse-only in the web UI; CLI/API performs category creation and reference upload.
- Browser image bytes go to Atlas, then Atlas writes canonical objects to Bunny.
- Atlas Image uses a user-only append-only direction log, not a chatbot.
- Generate Concept sends the source, ordered references, and ordered direction entries directly to `gpt-image-2` through the Image API edits endpoint.
- Start GPT Image 2 testing at medium quality, compare the identical job at high quality, and let the user choose the production default.
- Never commit secrets. Never commit, push, open a PR, or deploy without separate user approval.

## Prompt to give the implementation model

Start with this exact instruction:

> Read `C:\Users\Varshil\Desktop\Windows\Projects\aakb-atlas\.tasks\atlas-v0.2\README.md` and `C:\Users\Varshil\Desktop\Windows\Projects\aakb-atlas\.tasks\atlas-v0.2\FINAL-SPEC.md`, then execute only `C:\Users\Varshil\Desktop\Windows\Projects\aakb-atlas\.tasks\atlas-v0.2\01-foundation-auth-new-file-reference-catalog\packet.md` exactly as written. Write its report and stop at its human gate. Do not begin Milestone 2.

After each approved milestone, dispatch the next numbered packet using the same “execute exactly, write the report, stop at the human gate” instruction.
