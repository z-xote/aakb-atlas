Direct `#phone-workspace` activation **did not** select frame 13—it loaded `1 / 16`. I used All screens → `Direction & references (mobile)`, after which the counter correctly showed `13 / 16`.

- **A — PASS: Portrait References**
  - Horizontal category chips, two-column card grid, `3 selected`.
  - Header: `Atlas Image | Hartley — Main Bathroom | References | Step 2 of 3`.
  - No four-stage label row.
  - Exactly two bottom buttons: `Back to source` / `Continue to direction`.
  - Overflow: `scrollWidth 373`, `clientWidth 373`.
  - [phone-references.png](C:/Users/Varshil/Desktop/Windows/Projects/aakb-atlas/.tasks/2026-07-15-redesign-frame-13-mobile-workspace/evidence/phone-references.png)

- **B — PASS: Portrait Direction**
  - Visible: `Editing source`, `Vanity wall · before photo`, `Refs · 3`, `Edit`, conversation thread and composer.
  - Composer contained only `Add direction…`, `Voice input`, and `Send direction`.
  - `Generate concept` was outside the composer.
  - Exactly two bottom buttons: `Edit references` / `Generate concept`.
  - Overflow: `scrollWidth 373`, `clientWidth 373`.
  - [phone-direction.png](C:/Users/Varshil/Desktop/Windows/Projects/aakb-atlas/.tasks/2026-07-15-redesign-frame-13-mobile-workspace/evidence/phone-direction.png)

- **C — PASS: Landscape References**
  - Twelve categories formed one vertical column; cards formed a denser three-column grid.
  - `3 selected` tray present.
  - Bottom buttons present, each 383 px wide; neither was horizontally clipped.
  - Overflow: `scrollWidth 809`, `clientWidth 809`.
  - [phone-landscape-references.png](C:/Users/Varshil/Desktop/Windows/Projects/aakb-atlas/.tasks/2026-07-15-redesign-frame-13-mobile-workspace/evidence/phone-landscape-references.png)

- **D — PASS: Landscape Direction**
  - Split confirmed: source/refs at the left (`x=668` source label) and composer/thread at the right (`x=818` composer).
  - Exactly two bottom buttons: `Edit references` / `Generate concept`, each 390 px wide and unclipped.
  - Overflow: `scrollWidth 824`, `clientWidth 824`.
  - [phone-landscape-direction.png](C:/Users/Varshil/Desktop/Windows/Projects/aakb-atlas/.tasks/2026-07-15-redesign-frame-13-mobile-workspace/evidence/phone-landscape-direction.png)

- **E — PASS: State retention**
  - Selected `Tapware`.
  - Toggled `Aged brass mixer` off: its check/pressed state disappeared (`aria-pressed="false"`); count changed from `3 selected` to `2 selected`.
  - After Direction → References: `Tapware` remained active and count remained `2 selected`.
  - After returning to Direction: draft remained exactly `retain-this-draft-0715`.
  - After Phone → Phone landscape → Phone: draft still matched exactly.
  - Returning to References again retained `Tapware`, `2 selected`, and the toggled-off mixer state.

- **F — PASS: Theme**
  - Dark theme applied and was visually confirmed.
  - `Generate concept`, selected reference thumbnails, composer, mic, send button, and draft remained visible.
  - Composer contrast measured `14.52:1`; primary button remained visibly legible.
  - Theme was restored, with the draft unchanged.

- **G — FAIL: Console**
  - One console error at `2026-07-15T00:49:23.947Z` from `http://localhost:3000/_next/static/chunks/node_modules_next_dist_1ybzpk2._.js`.
  - Exact text:

```text
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

%s%s https://react.dev/link/hydration-mismatch 

  ...
    <HotReload globalError={[...]} webSocket={WebSocket} staticIndicatorState={{pathname:null, ...}}>
      <AppDevOverlayErrorBoundary globalError={[...]}>
        <ReplaySsrOnlyErrors>
        <DevRootHTTPAccessFallbackBoundary>
          <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
            <HTTPAccessFallbackErrorBoundary pathname="/mockup" notFound={<NotAllowedRootHTTPFallbackError>} ...>
              <RedirectBoundary>
                <RedirectErrorBoundary router={{...}}>
                  <Head>
                  <__next_root_layout_boundary__>
                    <SegmentViewNode type="layout" pagePath="layout.tsx">
                      <SegmentTrieNode>
                      <link>
                      <script>
                      <script>
                      <script>
                      <RootLayout>
                        <html lang="en" className="dm_sans_c0..." suppressHydrationWarning={true}>
                          <head>
                            <script
                              dangerouslySetInnerHTML={{
+                               __html: "\n              try {\n                var theme = window.localStorage.getIte..."
-                               __html: ""
                              }}
-                             src="chrome-extension://lgblnfidahcdcjddiepkckcfdhpknnjh/content/popups-script.js"
                            >
                          ...
                  ...
```

The diff identifies Chrome-extension injection as the mismatch source. All opened tabs were closed. The local voice notifier was attempted twice but timed out.