# Slides2Figma

A Chrome extension + Figma plugin pair that transfers the current Google Slides slide (or a selection of objects) into Figma as native, editable layers — without exporting to PPTX/PDF/SVG first.

Editable text stays a `TextNode`, simple shapes stay native Figma shapes, complex shapes become editable vectors, gradients become native Figma gradients, images preserve crop/position/opacity, and groups/z-order/transforms/opacity are preserved. Rasterization is allowed only as a last-resort fallback for a single unsupported element — never for a whole slide.

## Status

Early-stage / pre-alpha. Phases 00 and 01 are complete (schema + renderer proven against fixtures; real clipboard extraction confirmed feasible). No end-to-end Slides → Figma flow exists yet — that starts in Phase 02.

## Monorepo layout

- `packages/scene-schema` — Zod schema + types for the shared `Scene` model (the normalized boundary every extractor produces and every renderer consumes).
- `packages/figma-renderer` — Renders a validated `Scene` into a real Figma Frame (shapes, text, gradients, vectors, images, groups).
- `apps/figma-plugin` — Figma plugin shell; currently loads hand-authored fixture scenes for renderer development/QA.
- `apps/chrome-extension` — Manifest V3 Chrome extension; currently a Clipboard Inspector research tool (selection detection, capture, raw payload dump) used to reverse-engineer Google Slides' clipboard format.
- `fixtures/` — Hand-authored `Scene` JSON fixtures (shapes, text, gradients, vectors, images, groups, error cases) used to test the renderer independent of any real extractor.
- `docs/extraction-findings.md` — Findings from reverse-engineering Google Slides' clipboard payload formats.

## Roadmap

Legend: `[x]` complete · `[>]` in progress · `[ ]` planned

### [x] Phase 00 — Monorepo, Scene Schema & Fixture-Driven Figma Renderer
Built the shared `Scene` schema and a Figma renderer that turns hand-authored fixture JSON into a correct, editable Figma Frame — fully independent of any real Google Slides extractor.
- Zod schema + types for `Scene`, transforms, fills (solid/linear-gradient/radial-gradient), strokes, text, rectangle, ellipse, vector, image, group, and unsupported/diagnostic nodes.
- Renderer pipeline: validate → root Frame → z-order sort → recursive per-type render → metadata → select/scroll-into-view, with per-child error isolation at every nesting depth.
- Shape, text (per-run/paragraph styling), gradient, vector (path data), image (full-bleed), and group (nested/rotated/z-ordered) renderers.
- 7 fixtures covering rectangles, mixed-style text, linear gradients, a basic vector path, images, nested groups, and an unsupported-node error case — all schema-validated by Vitest and manually confirmed editable in Figma desktop.
- Deferred to later phases: image crop/fit, multi-stop/complex gradients, multi-path vectors, effects, group content clipping.

### [x] Phase 01 — Google Slides Extraction Research
Confirmed that Google Slides' native clipboard copy carries a rich enough payload to reconstruct part of the scene graph (Hypothesis A holds), via a real Chrome extension built to probe it.
- Built `apps/chrome-extension`'s MV3 Clipboard Inspector: selection detection, capture-copy, live format checklist, raw dump download, MAIN-world ↔ ISOLATED ↔ service-worker bridge.
- Captured and decoded 12 of 17 target element categories against a real Google Slides deck: single/mixed-style text, rectangle, line, image, cropped image, group, table, multi-select, and whole-slide capture.
- Key findings (see `docs/extraction-findings.md`): `drawings-object+wrapped` is the source for shape geometry and image blob references (and treats groups/multi-select/whole-slide identically as a flat sibling list); `document-slice-clip+wrapped` has friendlier named keys for table/paragraph/run styling; fill/stroke properties must be ignored for picture-type objects (they carry a meaningless default, not real image color).
- Untested by explicit user decision (deferred, not blocking): standalone rounded rectangle, ellipse, triangle, arrow/star/cloud/chevron/callout/wave shapes, true multi-stop gradients, charts, WordArt. Image crop math is captured but not yet decoded.

### [ ] Phase 02 — Basic Google Slides Extraction
Build the real `clipboard/parser.ts` (currently a stub) to turn a real Google Slides clipboard capture into a validated `Scene`: text, shapes, images, position, and z-order.
- Start with text and tables (cleanest, most reliable captures per Phase 01), then images/crops.

### [ ] Phase 03 — High Fidelity
Gradients beyond linear/radial, complex vector geometry, image crop, nested transforms, mixed text edge cases, effects.

### [ ] Phase 04 — Transport
Local relay for development → device pairing → production relay/WebSocket, so the Chrome extension and Figma plugin can hand off a `Scene` payload between them.

### [ ] Phase 05 — Fallbacks
Google Slides API adapter, SVG/raster fallback for genuinely unsupported content, PPTX adapter, tables, charts, WordArt.

Project is complete when every phase's acceptance criteria is verified and every phase above is `[x]`. See `.progressive/project/ROADMAP.md` for the canonical, live-updated version of this list and `.progressive/project/PROJECT_BRIEF.md` for full scope/constraints.

## Out of scope for v1

Real-time Slides ↔ Figma sync, Slides animations/speaker notes/comments, collaborative editing, Figma → Slides (reverse direction), guaranteed identical text rendering when a font is unavailable, and "update existing Figma frame on re-import" (metadata reserved for it, not implemented).

## Development

```bash
pnpm install
pnpm test
```

Requires Node ≥20 and pnpm 10.
