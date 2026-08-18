# Next Session

> Volatile hot context. Overwrite this file on each meaningful handoff. Durable phase history belongs in completed phase `Completion Record`s.

Outcome: IN PROGRESS

## Current phase
Phase 00 — Monorepo, Scene Schema & Fixture-Driven Figma Renderer — `.progressive/phases/00-scene-schema-renderer.md` (in progress — Tasks 1–3 done)

## Completed this session
- Read `Slides_to_Figma_Technical_Spec_v0.1.md` in full and initialized Progressive Context project state from it.
- Wrote `PROJECT_BRIEF.md`, `ARCHITECTURE.md`, `ROADMAP.md` (6 coarse phases), and detailed `Phase 00` file.
- Added `CONTEXT_MANIFEST.json` hints pointing back to the source Technical Spec sections.
- Classified project Complexity: L, Risk: Medium.
- User confirmed the Phase 00/01 sequencing resolution (renderer-first, Phase 00 stays before extraction research). Recorded in `.progressive/phases/00-scene-schema-renderer.md` and `ROADMAP.md`.
- Completed Phase 00 Task 1: pnpm workspace monorepo scaffold — root `package.json`/`pnpm-workspace.yaml`/`tsconfig.base.json`/`vitest.config.ts`/`.gitignore`, plus `package.json`+`tsconfig.json` for `apps/figma-plugin`, `packages/scene-schema`, `packages/figma-renderer`, `packages/shared`, and an empty `fixtures/` dir.
- Completed Phase 00 Task 2: `packages/scene-schema` — TypeScript types + Zod (v4) schema for `Scene`, `SceneNodeBase`, `Transform2D`, `Fill` (solid/linear-gradient/radial-gradient), `Stroke`, `Diagnostic`, `Asset`, `TextSceneNode` (+`TextRun`, `ParagraphStyle`), `RectangleNode`, `EllipseNode`, `VectorSceneNode`, `ImageSceneNode`, `GroupNode`, `UnsupportedNode` (Technical Spec §10–24), plus 55 Vitest unit tests covering valid/invalid parsing per schema, including recursive `GroupNode` nesting and malformed-scene rejection.
- Completed Phase 00 Task 3: hand-authored fixture JSON — `fixtures/basic/rectangle.json` (plain + rounded rectangle, mirrors Slide 01), `fixtures/text/mixed-text.json` (one `TextSceneNode`, 5 runs mixing font family/size/weight/color/bold/italic/letter-spacing, 2 paragraphs with different alignment/line-height, mirrors Slide 04), `fixtures/gradients/linear.json` (2-stop horizontal + 4-stop diagonal linear gradients covering a transparent stop, opacity, and a stroke, mirrors Slide 03), and `fixtures/errors/unsupported-node.json` (a valid rectangle sibling next to an `unsupported` chart node with a `warning` Diagnostic, for the per-child error-isolation test, mirrors Slide 12). Added `packages/scene-schema/src/fixtures.test.ts` to assert every fixture parses via `SceneSchema.safeParse` and that the unsupported fixture keeps its valid sibling and warning diagnostic.

## Verification evidence
- `pnpm install` — resolves all 5 workspace projects cleanly; added `zod@^4.4.3` to `packages/scene-schema`.
- `pnpm exec tsc -p packages/scene-schema/tsconfig.json --noEmit` → no errors.
- `pnpm -w test` → 15 test files, 59 tests passed (55 prior + 4 new fixture-validation tests).
- `pnpm --filter @slides2figma/scene-schema build` → compiles cleanly to `dist/`; `tsconfig.json` now excludes `src/**/*.test.ts` so test files don't ship in the built package.

## Blockers / uncertainty
- None currently blocking. Tooling profile still not selected/bootstrapped (`TOOLING_STATUS.json` is still `not_selected`) — deferred, not required to keep making Phase 00 progress.

## Important decisions
- `Fill` union scoped to `solid | linear-gradient | radial-gradient` for this phase (angular gradients and image fills are explicitly out of scope per the phase file, even though the Technical Spec §12 union lists them — deferred to Phase 03).
- `SceneNode` union scoped to the phase file's explicit type list (`text | rectangle | ellipse | vector | image | group | unsupported`); `FrameNode`, `LineNode`, `TableNode` from the Technical Spec §11 full union are out of scope for Phase 00.
- `GroupNode`/`SceneNode` are mutually recursive, which Zod can't `z.infer`; hand-wrote `SceneNodeBase`/`GroupNode`/`SceneNode` TypeScript interfaces in `scene-node.ts` and typed the schema against them, while every other node/type uses `z.infer` directly to avoid duplicating type definitions.
- Colocated `*.test.ts` files next to their source modules (matches `vitest.config.ts`'s existing glob); added `src/test-fixtures.ts` (non-test helper, not exported from `index.ts`) for a shared minimal-valid `SceneNodeBase` fixture used across node tests.
- Fixture folder taxonomy is by feature (`fixtures/basic/`, `fixtures/text/`, `fixtures/gradients/`, `fixtures/errors/`), one folder per fixture category, matching the phase file's own fixture path naming; `errors/` holds the unsupported-node/error-isolation fixture since it didn't fit the other three categories.
- Each fixture's `schemaVersion`/`source`/`canvas` fields follow the exact convention already established in `scene.test.ts`'s `validScene()` helper (`"0.1.0"`, `app: "google-slides"`, `1920×1080` canvas at `unit: "source"`) rather than inventing new values, and each fixture's `source.slideId`/`title` cite the Technical Spec §50 slide it mirrors (Slide 01/03/04/12).
- Added `packages/scene-schema/src/fixtures.test.ts` (reads fixture JSON from repo-root `fixtures/` via `fs.readFileSync`, not a bundler JSON import) so `pnpm -w test` gives automated evidence every fixture actually conforms to `SceneSchema`, not just visual inspection.

## Next action
Phase 00 Task 4: `apps/figma-plugin` shell — `manifest.json` (`editorType: ["figma"]`), `plugin/main.ts`, a minimal UI that can load a fixture by name (from the now-populated `fixtures/` dir) and trigger a render, and a dev build script. No transport/relay yet. Per `.progressive/phases/00-scene-schema-renderer.md` (Technical Spec §34–37 for plugin module structure/manifest shape/root Frame conventions).

## NEXT SESSION PROMPT
```text
Continue Phase 00 Task 4: build the apps/figma-plugin shell — manifest.json
(editorType: ["figma"]), plugin/main.ts, a minimal UI that can load one of the
fixtures/ JSON files by name and trigger a render, and a dev build script.
No transport/relay yet (that's Phase 04). Per .progressive/phases/00-scene-schema-renderer.md
(Technical Spec §34–37 for plugin module structure/manifest shape/root Frame conventions).

Read the active instruction layers, recover project state from the Default Read Set,
verify the Roadmap marker, and continue the next action autonomously. Do not reread
full completed phases or chat history unless evidence requires it.
```
