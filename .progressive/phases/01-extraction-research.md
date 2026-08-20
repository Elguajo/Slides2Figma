# Phase 01 — Google Slides Extraction Research (Clipboard / Web-UI / MAIN-world)

## Goal
A Chrome MV3 extension with a working Clipboard Inspector research tool that answers the Technical Spec's central open question (§63): *what can actually be recovered from Google Slides Web, without PPTX, per element type?* The phase output is a reusable inspection tool plus `docs/extraction-findings.md`, documenting — per fixture element category (§5.1) — which capture source (clipboard / web-UI DOM / MAIN-world internal state) recovered which properties, and which of the four fallback hypotheses (§71 A/B/C/D) holds. This directly scopes Phase 02's real extractor; no real parser is written yet.

## Context
Phase 00 proved the schema/renderer boundary works end-to-end against hand-authored fixtures, deliberately *not waiting* for a real extractor (Technical Spec §64, and this repo's own Phase 00 sequencing decision — see `.progressive/phases/00-scene-schema-renderer.md` Context). This phase now does the extraction-side work Phase 00 stayed independent of.

The spec is explicit that this is *research*, not implementation of a production importer (§63: "не начинать с полноценного продукта"). Its own recommended sprint order (§70, steps 10–14) is: chrome-extension-shell → clipboard-inspector → copy-event-dump → main-world-probe → extraction-findings. The four-hypothesis funnel (§71) is the actual decision tree this phase resolves:

- **Hypothesis A** — native copy carries a rich/custom clipboard representation sufficient to reconstruct part of the native scene graph → if true, a Clipboard Parser becomes the primary route.
- **Hypothesis B** (if A is false/insufficient) — MAIN-world/renderer state exposes the missing properties.
- **Hypothesis C** (if B is false/insufficient) — public Slides API + DOM/SVG + targeted fallback give sufficient fidelity.
- **Hypothesis D** (if C is false/insufficient) — PPTX supplies properties otherwise unrecoverable.

None of these can be answered from documentation alone — §5.1 is explicit that "Google places its internal scene graph in the system clipboard" is a hypothesis to confirm experimentally, not an assumption. This phase's entire value is running that experiment against a real `SLIDES2FIGMA TEST SUITE` presentation (§50) and writing down what's actually there.

**Manual-research dependency**: capturing real clipboard/DOM data requires a live Google Slides session in the user's own Google account and browser — something outside autonomous reach. This phase's code (extension shell, bridge, Inspector UI) is built and unit-tested independently; the actual per-fixture-element capture pass is a joint manual step with the user, mirroring Phase 00's Figma-desktop verification loop.

## Context hints
Full source detail lives in `Slides_to_Figma_Technical_Spec_v0.1.md`:
- §5 — data source priority: Clipboard Adapter is P0/primary research source; the exact fixture-element checklist to test (single text, mixed-style text, rectangle, rounded rectangle, ellipse, line, arrow, gradient shape, image, cropped image, group, table, WordArt, chart, multi-select, whole slide) lives in §5.1.
- §6 — Web UI Adapter: ISOLATED world (extension UI/storage/messaging) vs MAIN world (research/extraction only, minimal use, never mixed with product logic) — Google-specific code confined to `packages/google-slides-web-adapter/` (created when Phase 02 needs it; this phase only proves what MAIN-world access can see).
- §7 — Internal State Adapter (experimental): anything read from Google internals must be tagged `ExtractedProperty<T>` (`value`/`source`/`confidence`), never trusted as the sole production source.
- §26–28 — Chrome Extension: MV3 manifest with minimal permissions (`storage`, `scripting`, `host_permissions: docs.google.com/presentation/*`; `clipboardRead`/`clipboardWrite` dev-only), the `apps/chrome-extension/src/{background,content,injected,clipboard,google,transport,debug,shared}` module layout, and the mandatory MAIN world → `postMessage` → ISOLATED content script → `chrome.runtime.sendMessage` → service worker bridge with Zod/JSON-Schema validation on every message (never accept arbitrary `window.postMessage` commands).
- §29 — Clipboard Inspector: the first concrete dev tool to build, its UI shape, its dump JSON shape, and the explicit rule that capture only happens after an explicit user action, never passive/background monitoring.
- §30 — Network/DevTools protocol inspection is explicitly out of scope unless MAIN-world probing proves insufficient, and even then belongs in a separate `tools/slides-network-inspector/` dev-only build, not this phase.
- §50 — Test Presentation slide numbering (`SLIDES2FIGMA TEST SUITE`, slides 01–12) to mirror when running the manual capture pass — the same numbering Phase 00's fixtures already reference by `slideId`.
- §56–57 — Security rules (no passive clipboard monitoring, no clipboard history, no raw payload in analytics, no production text-content logging, minimal permissions, MAIN-world must never execute remote code) and future Privacy Modes (Cloud/Local Relay, Clipboard Transfer) — informs what the dump/debug tooling built here must never do, even though no relay exists yet.
- §71 — the four-hypothesis funnel this phase's findings doc must resolve, per element category.

## In scope
- `apps/chrome-extension` MV3 shell: `manifest.json` (minimal permissions per §26; dev build may add `clipboardRead`/`clipboardWrite`), `background/service-worker.ts`, `content/bridge.ts` + `content/ui.ts`, `injected/main-world.ts`, `clipboard/{inspector.ts,formats.ts,parser.ts}` (parser.ts stays a stub — no real parsing yet), `google/{selection.ts,slide-context.ts}` (selection/current-slide detection only), `transport/relay-client.ts` (stub — no relay exists until Phase 04), `debug/dump.ts`, a minimal dev build script mirroring `apps/figma-plugin/scripts/build.mjs`'s esbuild pattern.
- MAIN world ↔ ISOLATED content script ↔ service worker bridge (§28): every message is a versioned, `channel`-tagged object, Zod-validated on receipt; malformed/unexpected payloads are rejected, not forwarded.
- Clipboard Inspector UI (§29): selection-detected indicator, "Capture Copy" control, live format checklist (`text/plain`, `text/html`, `image/png`, `image/svg+xml`, any custom/web formats found), raw dump download (JSON metadata; large binary payloads as separate files, not inlined).
- MAIN-world probe (§7): read-only exploration helpers around `window`/DOM/SVG/canvas objects and `copy` event handling during selection/copy — every finding tagged `ExtractedProperty<T>` with `source: "internal"` and an honest `confidence`. Read-only: no mutation of Google's page state, no calling private Google functions beyond inspection.
- Joint manual research pass against the `SLIDES2FIGMA TEST SUITE` presentation (§50), capturing a raw dump for every §5.1 fixture element category.
- `docs/extraction-findings.md`: per-element-category findings (which source recovered which properties, gradients/text-run-styling/exact-shape-path/original-image recoverability, and a stated Hypothesis A/B/C/D conclusion per §71).

## Out of scope
- Any real Clipboard/DOM → `Scene` parser (`clipboard/parser.ts` stays a stub) — that's Phase 02's "first-google-text-parser"/"first-google-shape-parser" work (§70 steps 15–16), which needs this phase's findings first.
- Google Slides API adapter (§8) and PPTX adapter (§9) — deferred per §9's fallback ordering (web extraction → API → PPTX); not needed until this phase's findings show a concrete gap.
- Relay/transport/pairing (§67, Phase 04) — `transport/relay-client.ts` is a stub only, nothing is sent anywhere.
- Network/DevTools protocol inspection (§30) — only revisited as a separate dev-only tool if MAIN-world probing proves insufficient.
- Production permission minimization (§26) — this phase's build may carry dev-only `clipboardRead`/`clipboardWrite`; trimming for production happens once Phase 0 findings are in.
- `packages/google-slides-web-adapter/` as a real adapter package — created in Phase 02 once findings show what it needs to contain.

## Tasks
- [x] Chrome MV3 extension shell (`manifest.json`, `service-worker.ts`, content script entry, dev build script)
- [x] MAIN-world injected script + `postMessage` → content-script → service-worker bridge, with versioned Zod-validated message schema
- [x] Clipboard Inspector UI (selection detection, Capture Copy control, live format list)
- [x] Copy-event format capture + raw dump storage/download (`ClipboardItem.types`, `copy` event payloads, binary payloads as separate files)
- [x] MAIN-world probe: read-only `window`/DOM/SVG/canvas exploration helpers, findings tagged `ExtractedProperty<T>`
- [x] Joint manual research pass: capture dumps for every §5.1 fixture element category against the `SLIDES2FIGMA TEST SUITE` presentation — done against a real ad-hoc deck ("Your big idea", user sign-off) in place of the still-nonexistent formal test suite; 12 of 17 categories captured with real evidence (multi-select and whole-slide `Cmd+A` closed in a follow-up session). The remaining gaps (rounded rectangle standalone, ellipse, triangle, real arrow/star/cloud/chevron/callout/wave, true gradients, chart, WordArt) are element types absent from this ad-hoc deck, not evidence against Hypothesis A; user accepted this coverage as final for Phase 01 rather than building the formal test suite — see `docs/extraction-findings.md`
- [x] Author `docs/extraction-findings.md`

## Acceptance criteria
- [x] Loading the unpacked extension in Chrome on a `docs.google.com/presentation/*` page shows the Clipboard Inspector UI with a live selection-detected indicator.
- [x] Pressing "Capture Copy" after selecting a fixture element records at least `text/plain` and `text/html`, plus any richer/custom formats actually present, and produces a downloadable raw dump.
- [x] The bridge rejects a malformed `window.postMessage` payload (wrong `channel`/`version`/unexpected `type`) without forwarding it to the service worker — verified by a Vitest unit test on the validation function.
- [x] `docs/extraction-findings.md` exists and documents, for every §5.1 fixture element category, which source recovered which properties and a stated Hypothesis A/B/C/D conclusion.
- [x] `pnpm -w test` still passes.

## Negative / security cases
- Malformed/unexpected `window.postMessage` payloads (wrong `channel`/`version`, arbitrary `type`) are rejected by the bridge, never executed or forwarded to the service worker (§28, §56.12 — MAIN-world extraction must never execute remote code).
- No clipboard/content capture happens without an explicit user action (Capture Copy click) — no passive/background monitoring, no clipboard history (§56.1–3).
- Raw dumps stay local (downloaded file / extension storage); nothing is sent to any remote endpoint in this phase (no relay exists yet), and slide text content is never written to logs or analytics (§56.4, §56.6).

## Verification
- `pnpm -w test` (Vitest) for the bridge's message-schema validation.
- Manual (joint, with the user): load the unpacked extension against the real `SLIDES2FIGMA TEST SUITE` presentation in Chrome, run Capture Copy against every §5.1 element category, confirm dumps are produced and downloadable, and that findings get written into `docs/extraction-findings.md`.
- `.progressive/system/QUALITY_PROTOCOL.md` validation order applies once implementation starts (targeted tests → type check → lint → build → manual/runtime check).

## Completion Record

**Outcome:** Hypothesis A (native clipboard carries a rich/custom scene-graph
representation) **holds** for every element category actually captured:
single- and mixed-style text, rectangles, lines, images (with a documented
fill-color caveat for picture-type objects), groups, tables, multi-select,
and whole-slide (`Cmd+A`) — 12 of the 17 §5.1 categories, all against a real
Google Slides session via the Clipboard Inspector built in this phase. No
capture this phase forced a fallback to Hypothesis B/C/D.

**Scope deviation (user-approved):** The formal 12-slide
`SLIDES2FIGMA TEST SUITE` (§50) was never built. Research ran instead
against a real pre-existing deck ("Your big idea") already in the user's
Google account. That deck simply doesn't contain several §5.1/§50 element
types — rounded rectangle standalone, ellipse, triangle, WordArt, and chart
stay genuinely untested; a real arrow shape and true multi-stop gradients
were resolved as *absent from this deck* rather than tested (its "arrows"
are text bullet glyphs, its apparent gradient is a segmented table); and
§50 Slide 08's star/cloud/chevron/callout/wave categories have no
corresponding fixture at all in this deck. The user explicitly accepted
this coverage as final for Phase 01 rather than building the formal deck,
so these gaps carry forward as open questions for Phase 02/03 to resolve
if/when they become blocking, rather than being treated as phase-blocking.

**Key findings for Phase 02:**
- `drawings-object+wrapped` is the only source for shape geometry (transform
  matrix, `shapeTypeCode`), image blob references, and — confirmed this
  session — every member of a group, multi-select, or whole-slide capture,
  each as an independent sibling entry in one flat `resolved` array (no
  nested/grouping structure in the payload itself).
- `document-slice-clip+wrapped` uses friendlier named keys and should be
  preferred for table/paragraph/run-level styling when both formats carry
  the same data.
- Property `15`/`19` (fill/stroke) is reliable for real shapes and tables but
  must be ignored for picture-type objects (§ cross-cutting finding).
- The Clipboard Inspector's `Capture Copy` reads the *current* OS clipboard
  rather than triggering a copy — a real `Cmd+C` must precede it, or it
  silently captures a stale/unrelated clipboard entry. Worth a UX fix before
  Phase 02 relies on this tool routinely.

**Full detail:** `docs/extraction-findings.md`.
