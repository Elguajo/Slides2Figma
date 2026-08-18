# Phase 00 — Monorepo, Scene Schema & Fixture-Driven Figma Renderer

## Goal
A Figma plugin that renders a correct, editable Figma Frame — text, native shapes, gradients, a basic vector, an image, and groups/z-order — from a hand-authored Scene Model JSON fixture, fully independent of any real Google Slides extractor.

## Context
The Technical Spec labels extraction research "Phase 0" (§63: "не начинать с полноценного продукта, сначала ответить на главный вопрос — что можно получить из Google Slides Web"), which reads as if extraction research should come first. But the spec's own concrete recommended commit order (§70) does the opposite: monorepo init → scene-schema → fixtures → figma-plugin-shell → renderer (rectangle/text/gradients/vector/images) *before* chrome-extension-shell → clipboard-inspector → main-world-probe → extraction-findings. §64 explicitly says "не ждать готового Google extractor" (don't wait for a ready extractor) when describing this renderer work.

This phase resolves that contradiction by following §70's concrete order: build the schema and renderer first, against hand-written fixtures, because that work is fully within our control and testable with Vitest + manual Figma checks, whereas the extraction research (Phase 01) depends on undocumented Google behavior that may take longer or dead-end. This is a sequencing choice, not a scope cut — nothing here is skipped, only reordered. **User-confirmed 2026-08-18: Phase 00 stays first**, Phase 01 (extraction research) follows.

Non-negotiable architectural rule for this and every later phase (Technical Spec §4, §72): no code goes directly from a source-specific concept to a Figma API call — every renderer input must be a `Scene` conforming to `packages/scene-schema`. This phase exists specifically to prove that boundary works before any real adapter is written.

## Context hints
- Full source detail lives in `Slides_to_Figma_Technical_Spec_v0.1.md`:
  - §10–24 — Scene/Node/Fill/Gradient/Stroke/Text/Vector/Image models to implement in `packages/scene-schema`.
  - §34–37 — Figma plugin module structure, manifest shape, root Frame + metadata conventions.
  - §36 — exact render pipeline order (validate → load assets → resolve fonts → create root Frame → sort by zIndex → recursive render → transforms → fills/strokes → text runs → metadata → select + scroll into view).
  - §16–17 — font resolution/fallback strategy and text-rendering step order (`createText` → collect fonts → `loadFontAsync` → set `characters` → styles by UTF-16 range).
  - §48–49 — monorepo layout and recommended stack (pnpm workspaces, Zod, Vitest).
  - §50 — test presentation fixture slides to mirror when authoring fixture JSON (Slide 01 basic shapes, Slide 03 gradients, Slide 04 text).

## In scope
- pnpm workspace monorepo scaffold: `apps/figma-plugin`, `packages/scene-schema`, `packages/figma-renderer`, `packages/shared`, `fixtures/`.
- `packages/scene-schema`: TypeScript types + Zod schema for `Scene`, `SceneNodeBase`, `Transform2D`, `Fill` (solid / linear-gradient / radial-gradient), `Stroke`, `TextSceneNode` (+`TextRun`, `ParagraphStyle`), `RectangleNode`, `EllipseNode`, `VectorSceneNode`, `ImageSceneNode`, `GroupNode`, `UnsupportedNode`, `Diagnostic`.
- Hand-authored fixture JSON: `fixtures/basic/rectangle.json`, `fixtures/text/mixed-text.json`, `fixtures/gradients/linear.json`, plus one fixture with a deliberately unsupported node type for the error-isolation test.
- `apps/figma-plugin` shell: `manifest.json` (`editorType: ["figma"]`), `plugin/main.ts`, a minimal UI that can load a fixture by name and trigger a render — no transport/relay yet.
- `packages/figma-renderer`: `scene-renderer`, `text-renderer` (with font resolver), `shape-renderer`, `vector-renderer`, `image-renderer`, `gradient-renderer`.
- Render pipeline implemented per Technical Spec §36.
- Root Frame naming/metadata per §37 (`slides2figma` plugin data), including `sourceId`/`sourceType`/`parserVersion` fields even though no real source exists yet (§46 — needed later for re-import/update, must not be an afterthought).
- Per-child error isolation: one failing child produces a `Diagnostic` and a placeholder, not an aborted import (§36, §58).
- Vitest unit tests for scene-schema validation and any renderer logic that doesn't require the live Figma sandbox.

## Out of scope
- Chrome extension, Clipboard Inspector, any real Google Slides extraction (Phase 01).
- Relay/transport/pairing (Phase 04).
- Gradient types beyond linear + radial, complex multi-path vector geometry, image crop math, effects (drop shadow/blur), nested/rotated group transforms (Phase 03).
- Tables, charts, WordArt, video (Phase 05).
- Any raster fallback logic beyond marking a node `UnsupportedNode` — there is no fallback asset source yet.

## Tasks
- [x] Init pnpm workspace monorepo (root `package.json`, `pnpm-workspace.yaml`, base `tsconfig`, `apps/`, `packages/`, `fixtures/` directories, Vitest config)
- [x] `packages/scene-schema`: types + Zod schema + unit tests
- [x] Author `fixtures/basic/rectangle.json`, `fixtures/text/mixed-text.json`, `fixtures/gradients/linear.json`, and one unsupported-node fixture
- [x] `apps/figma-plugin` shell (manifest, `main.ts`, minimal fixture-loading UI, dev build script)
- [x] `packages/figma-renderer`: rectangle + ellipse render
- [x] `packages/figma-renderer`: text render (font resolver, per-run styling, paragraph styling)
- [x] `packages/figma-renderer`: linear + radial gradient render
- [ ] `packages/figma-renderer`: basic vector render
- [ ] `packages/figma-renderer`: image render (no crop yet)
- [ ] Group/z-order handling + diagnostics reporter + per-child error isolation

## Acceptance criteria
- [x] Loading `fixtures/basic/rectangle.json` in the Figma plugin produces a native `RectangleNode` with correct position/size/rotation/opacity/fill.
- [ ] Loading `fixtures/text/mixed-text.json` produces one editable Figma `TextNode` with correct per-range font/size/weight/color, and the text can be edited by hand after import.
- [ ] Loading `fixtures/gradients/linear.json` produces a native `GRADIENT_LINEAR` paint with all stops and correct direction, editable in Figma's fill panel.
- [ ] The unsupported-node fixture still produces a Frame with its other children intact plus a `warning` Diagnostic — no aborted import, no whole-slide rasterization.
- [x] `pnpm -w test` runs scene-schema validation tests and passes.

## Negative / security cases
- Malformed/invalid fixture JSON is rejected by schema validation with a diagnostic, not a plugin crash.

## Verification
- `pnpm -w test` (Vitest) for scene-schema and renderer unit tests.
- Manual: load each fixture in the Figma desktop app via the dev plugin and confirm editability by hand (click text to edit, open the gradient to see stops, ungroup a group) — this is the achievable subset of the Technical Spec §69 Definition-of-Done items 4–9 without a real Google source.
- `.progressive/system/QUALITY_PROTOCOL.md` validation order applies once implementation starts (targeted tests → type check → lint → build → manual/runtime check).

## Completion Record
<populate only when this phase becomes [x]>
