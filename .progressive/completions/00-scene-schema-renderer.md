# Phase 00 Completion — Monorepo, Scene Schema & Fixture-Driven Figma Renderer

Status: COMPLETED

## Outcome
A Figma plugin renders a correct, editable Figma Frame — native shapes, mixed-styled text, linear/radial gradients, a basic vector, a full-bleed image, and nested/rotated/z-ordered groups with per-child error isolation — from hand-authored Scene Model JSON fixtures, fully independent of any real Google Slides extractor. All 10 phase tasks and all acceptance criteria are checked; every fixture has been manually confirmed editable in Figma desktop.

## Delivered
- `packages/scene-schema`: Zod schema + types for `Scene`, `SceneNodeBase`, `Transform2D`, `Fill` (solid/linear-gradient/radial-gradient), `Stroke`, `TextSceneNode`, `RectangleNode`, `EllipseNode`, `VectorSceneNode`, `ImageSceneNode`, `GroupNode`, `UnsupportedNode`, `Diagnostic`.
- `packages/figma-renderer`: `scene-renderer` (root Frame + zIndex-ordered dispatch + per-child error isolation), `shape-renderer`, `text-renderer` (font resolver, per-run/paragraph styling), `gradient-renderer`, `vector-renderer`, `image-renderer`, `group-renderer`.
- `apps/figma-plugin`: manifest, plugin shell, minimal fixture-loading dev UI.
- Fixtures: `basic/rectangle`, `text/mixed-text`, `gradients/linear`, `vector/basic-path`, `images/basic`, `groups/basic`, `errors/unsupported-node` — all schema-validated by Vitest and manually verified in Figma desktop.

## Implementation notes
- Render pipeline follows Technical Spec §36: validate → root Frame → sort by `zIndex` → recursive per-type render → metadata → select/scroll-into-view.
- `GroupNode` renders as a Figma **Frame**, not `figma.group()` — Technical Spec §22's "relative transforms" for group children map directly onto Figma's own parent-relative x/y semantics, so nested/rotated groups need zero manual coordinate composition; `applyTransform` (originally shape-only) was widened to a structural `TransformableNode` interface so the group Frame could reuse it.
- Per-child error isolation is centralized in one place: `scene-renderer.ts`'s `renderNode` is the sole recursion point (top-level loop and every group's children both call it), so wrapping its switch body in a single try/catch isolates render failures at every nesting depth as an `error`-severity `render-error` Diagnostic, without duplicating the guard per node type.
- `group-renderer.ts` takes an injected `renderChild` callback rather than importing the dispatcher directly, avoiding a circular module dependency between `scene-renderer.ts` and `group-renderer.ts`.
- `UnsupportedNode` has its own explicit dispatch case producing a `warning`-severity `unsupported-node-type` diagnostic from the node's own `sourceType`/`reason`, distinct from the generic `info`-severity `renderer-not-implemented` fallback for genuinely unhandled types.
- Image rendering is full-bleed only (Task 9 scope) — `crop`/`fit` are ignored, deferred to Phase 03; only inline base64 `Asset.bytes` are supported, `Asset.url` produces a diagnostic instead of fetching.
- Vector rendering only handles `pathData`; SVG-string and no-geometry placeholder paths are deferred.
- A `BigInt` shim (`apps/figma-plugin/scripts/build.mjs` esbuild banner) is required for the plugin-sandbox bundle to load in Figma **web** (not desktop) — zod v4 evaluates `BigInt(...)` at module load for an int64 table this codebase never uses, and Figma web's plugin sandbox has no working `BigInt`.

## Decisions made
- Phase 00 (schema + renderer) sequenced before Phase 01 (extraction research), per Technical Spec §70's concrete commit order rather than §63's "Phase 0" label — user-confirmed 2026-08-18, documented in the phase file's Context section.
- Coordinate/transform semantics: every node's `transform.x/y` is relative to its immediate parent (root Frame or enclosing group), matching Figma's native parent-relative positioning and Technical Spec §22 exactly — no adapter-side or renderer-side coordinate translation needed at any nesting depth.

## Deviations / technical debt
- Tooling profile still not selected/bootstrapped (`TOOLING_STATUS.json` remains `not_selected`) — deferred across the whole phase, not blocking.
- Out-of-scope by design (per phase file, deferred to later phases): Chrome extension/Clipboard Inspector/real extraction (Phase 01), relay/transport/pairing (Phase 04), gradient types beyond linear/radial, multi-path vector geometry, image crop math, effects, nested/rotated group *content* clipping (Phase 03), tables/charts/WordArt/video (Phase 05), any raster fallback beyond `UnsupportedNode` marking.

## Problems discovered
- Figma **web**'s plugin sandbox (unlike desktop and unlike the UI iframe) has no working `BigInt`, crashing zod v4's bundled core at load time — fixed with a scoped `BigInt` shim in the plugin-sandbox esbuild bundle only. See `apps/figma-plugin/scripts/build.mjs`.

## Verification evidence
- `pnpm -w test` → 16 test files, 69 tests passed.
- `pnpm --filter @slides2figma/figma-renderer build` (tsc) → no errors.
- `pnpm --filter @slides2figma/figma-plugin typecheck` (both tsconfigs) → no errors.
- `node apps/figma-plugin/scripts/build.mjs` → plugin + UI bundles built with no errors.
- Manual: every fixture loaded via the dev plugin and confirmed in Figma desktop — rectangle position/size/rotation/opacity/fill, editable mixed-styled text, editable `GRADIENT_LINEAR` fill with correct stops/direction, basic vector path, full-bleed image fill (both plain and rotated/reduced-opacity), and nested/rotated/z-ordered groups (including per-child isolation for an `unsupported` child nested inside a group) — confirmed working by user 2026-08-18.

## Architectural impact
Later phases (01+) may assume: a stable, Zod-validated `Scene`/`SceneNode` boundary exists and is the only thing any renderer ever consumes (Technical Spec §4/§72 — no source-specific code may call the Figma API directly); the render pipeline handles arbitrary nesting depth with per-child error isolation already in place, so a real extractor's imperfect output degrades gracefully to Diagnostics rather than aborting; root Frame metadata (`sourceId`/`sourceType`/`parserVersion` via `slides2figma` plugin data) is already wired for future re-import/update use even though no real source exists yet.

## Follow-up
- None blocking. Phase 03 should revisit: gradient `rotation` field semantics, vector SVG-string/approximation fallback, image crop/fit math, and group content clipping if Google Slides groups turn out to clip in practice.
