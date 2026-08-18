# Architecture — Slides2Figma

## Recommended stack
- Runtime/framework: TypeScript everywhere; `pnpm` workspace monorepo; Vitest for testing.
- Chrome extension: Manifest V3 (`apps/chrome-extension`), ISOLATED-world content script + minimal MAIN-world injected script bridged via `window.postMessage` → `chrome.runtime.sendMessage`.
- Figma plugin: Figma Plugin API (`apps/figma-plugin`), `editorType: ["figma"]`.
- Data/storage: no product database. Relay (`services/relay`, Node.js/TypeScript) is a transient pass-through only, no permanent presentation storage.
- Deployment/hosting: local dev transport (`http://localhost:4317`) first; production relay/hosting deferred to the Transport phase.
- Important providers/dependencies: Zod (schema validation), React (optional, for plugin/extension UI), Google Slides Apps Script/Slides API (supplemental adapter only, not primary).

## Why this fits
The product's hardest uncertainty is *what Google Slides Web actually exposes* (clipboard richness, DOM/internal state, public API completeness) — this is genuinely unknown and must be treated as a research question, not assumed. The adapter → Scene Model → renderer separation lets that uncertainty stay contained to swappable adapter packages instead of infecting the Figma-facing code, and lets the Figma renderer be built and tested against hand-written fixtures before any real extractor exists (Technical Spec §4, §63–§65, §71–§72).

## System shape
```text
Google Slides
     │
     ├── Clipboard Adapter            [P0 research]
     ├── Web UI Adapter               (ISOLATED + minimal MAIN world)
     ├── Internal State Adapter       [experimental]
     ├── Google Slides API Adapter    [supplemental]
     └── PPTX Adapter                 [fallback only, deferred]
              │
              ↓
      Property Resolution   (packages/property-resolver — per-property precedence, not global)
              │
              ↓
      Normalized Scene Model   (packages/scene-schema — Zod-validated)
              │
              ↓
        Transport / Relay   (services/relay — deferred; local dev transport first)
              │
              ↓
         Figma Renderer   (packages/figma-renderer)
              │
              ↓
        Native Figma Nodes
```

Non-negotiable rule (Technical Spec §72): no code goes directly from a source-specific concept (`googleShape.type === "..."`) to a Figma API call. Every renderer input is a `Scene` conforming to `packages/scene-schema`. This is what lets a future `PowerPoint → Scene → Figma` or `Keynote → Scene → Figma` adapter reuse the renderer unchanged.

## Sources of truth
- Scene Model shape/validation → `packages/scene-schema`
- Cross-adapter property conflicts → `packages/property-resolver` (property-specific precedence policy — e.g. gradients prefer Clipboard/Internal over PPTX; object IDs prefer Slides API over Clipboard; see Technical Spec §25)
- Google Slides-specific extraction logic → `packages/google-slides-web-adapter`, `packages/google-slides-api-adapter` (isolated so a Google Slides Web UI change only requires replacing these, not the renderer)
- Figma node creation → `packages/figma-renderer` (plugin `main.ts` only orchestrates: receive Scene → validate → call renderer)
- Font availability/mapping → `apps/figma-plugin/src/fonts/resolver.ts`

## Security/trust boundaries
- MAIN-world injected script runs inside Google's own JS environment; treated as an untrusted-ish research surface. It must never execute remote code and must only communicate outward via `window.postMessage`, which the ISOLATED content script validates against a schema (Zod) before forwarding to the service worker — arbitrary `postMessage` commands are never trusted directly (Technical Spec §28–§29).
- Relay is a transient pass-through: cryptographically random session/pairing tokens, short pairing-code expiry, TLS/WSS only, payload TTL, no permanent DB storage by default, explicit `Disconnect / Clear session` for the user (Technical Spec §31, §56).
- Chrome extension requests minimal permissions in production (`storage`, `scripting`, host permission scoped to the Slides presentation URL pattern); `clipboardRead`/`clipboardWrite` are dev-build-only until the Clipboard Inspector proves they're required, and must be trimmed back for production (Technical Spec §26).
- No presentation content is logged in production; clipboard is never monitored continuously, only captured after an explicit user action (Technical Spec §56).

## Operational assumptions
- Local dev transport (`localhost:4317`) exists before any production relay; `localhost` is removed from allowed domains in production builds.
- Figma plugin manifest restricts network access to the relay domain only (dev: `localhost:4317`; prod: the eventual relay domain).
- Target render frame defaults to 1920×1080 and is configurable; `preserveAspectRatio = true` by default.
- The Figma renderer must tolerate a single failing child without aborting the whole import — a failure becomes a `Diagnostic`, not a crash (Technical Spec §36, §58).

## Architecture-change triggers
- If Hypothesis A (rich clipboard payload) is falsified during Phase 01 research, the Clipboard Adapter is demoted and the Web UI / Internal State adapters become the primary route — this is an anticipated fallback path, not an architecture break, because both still normalize into the same Scene Model.
- If Google Slides Web internals change materially, only `google-slides-web-adapter` (and possibly `google-slides-api-adapter`) needs to change — the renderer and schema stay stable. If this stops being true in practice, that's a signal the adapter boundary has leaked and needs revisiting.
- Choosing a production relay hosting provider/data-residency model (Phase 04) should be recorded here once decided, since it affects the trust-boundary section above.
