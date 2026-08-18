# Project Brief — Slides2Figma

## Outcome
A Chrome extension + Figma plugin pair that transfers the current Google Slides slide (or a selection of objects) into Figma as native, editable layers — without the user manually exporting to PPTX/PDF/SVG first. Editable text stays `TextNode`, simple shapes stay native Figma shapes, complex shapes become editable vectors, gradients become native Figma gradients, images preserve crop/position/opacity, and groups/z-order/transforms/opacity are preserved. Rasterization is allowed only as a last-resort fallback for one unsupported element, never for a whole slide.

## Users and jobs
- Primary user: a designer or PM who drafts a deck/layout in Google Slides and needs to continue the visual as real, editable Figma layers — not a flattened screenshot.
- Core jobs:
  - "Send the slide I'm looking at into Figma and keep working on it as native layers."
  - "Send just the objects I selected into Figma."

## Must-have scope
- `Send current slide` and `Send selection` actions from a Chrome extension panel; a Figma plugin receives the payload and creates a Frame.
- Text imports as an editable `TextNode` with per-run styling (font, size, weight, color, bold/italic/underline) and paragraph styling (alignment, line height, spacing) preserved.
- Rectangle / rounded rectangle / ellipse / line import as native Figma shape nodes.
- Complex shapes (star, cloud, chevron, callout, wave, curved arrow, custom geometry) import as editable `VectorNode`/SVG, never as a bitmap.
- Linear and radial gradients import as native Figma gradient paints with all stops, positions, and per-stop opacity preserved.
- Images import as image fills preserving crop, position, rotation, and opacity.
- Groups, z-order, and per-node transform (position/size/rotation/opacity) are preserved; groups are never flattened.
- A single unsupported child element degrades to a placeholder/diagnostic — it never forces rasterizing the whole slide.
- All extraction sources (clipboard, web UI, internal state, Slides API, PPTX) must normalize into one shared Scene Model before Figma rendering; the Figma renderer must never depend on which source produced a node (see [[architecture]] adapter invariant).

## Explicit constraints
- Chrome Extension Manifest V3, minimal permissions (`storage`, `scripting`, host permission scoped to `docs.google.com/presentation/*`); `clipboardRead` added only if research proves it's needed, and only in a dev build first.
- Figma Plugin API only, `editorType: ["figma"]` initially (Figma Slides support deferred).
- TypeScript across the monorepo; `pnpm` workspaces; Zod for schema validation; Vitest for testing.
- No continuous clipboard monitoring; extraction only after an explicit user action.
- No permanent storage of slide content or text logging in production; any relay payload has a short TTL.
- All network transport is HTTPS/WSS only; session/pairing tokens are cryptographically random and short-lived.

## Material assumptions
- **Unvalidated — Hypothesis A (source Technical Spec §71):** Google Slides' native copy operation exposes a rich-enough payload to reconstruct part of the scene graph via the Clipboard Adapter. This is the subject of the extraction-research phase, not yet confirmed.
- **Sequencing assumption (resolved for Phase 00, flagged for confirmation):** the Technical Spec labels extraction research "Phase 0" (§63) but its own recommended commit order (§70) builds the scene schema and Figma renderer against hand-authored fixtures *before* touching the Chrome extension or clipboard research. This Brief and the Roadmap follow §70's concrete order because it is fully testable without depending on Google's undocumented behavior. See Roadmap notes and Phase 00 context.
- Target export frame defaults to 1920×1080 but must stay configurable; preserving relative geometry matters more than hitting an exact pixel count.

## Out of scope — first release
- Real-time sync between Google Slides and Figma.
- Slides animations, speaker notes, comments.
- Collaborative editing between Slides and Figma.
- Figma → Google Slides (reverse direction).
- Full fidelity for tables, charts, WordArt, video (deferred to the Fallbacks phase; treated as P1/P2/P3).
- Guaranteed identical text rendering when the exact font is unavailable in Figma (a tracked fallback + diagnostic is sufficient).
- Production relay, pairing, and WebSocket transport (deferred phase; a local dev transport comes first).
- PPTX adapter (fallback only, added if web/API extraction proves insufficient).
- "Update existing Figma frame" / sync-on-reimport (architecturally reserved via `sourceId` metadata, not implemented).

## Success criteria
- A user can open an ordinary Google Slides design slide, click "Send current slide," and get a Figma Frame.
- The imported title text can be clicked and edited directly.
- An imported rectangle's fill can be changed directly.
- An imported gradient shape's stops can be opened and edited as a native Figma gradient.
- An imported image can be repositioned/re-cropped normally.
- An imported complex shape's vector points can be edited.
- An imported group can be ungrouped and behaves as expected.
- The overall result is visually close to the source slide, and is composed predominantly of editable native/vector layers rather than SVG/PNG (this is the definition-of-done bar from the Technical Spec, §69).
- Non-blocking quality targets to trend toward over time: median position error ≤1px / P95 ≤2px at a 1920×1080 target frame; exact gradient stop count/position; rising "Native" share and falling "Raster fallback" share in the structural fidelity metric.

## Classification
- Complexity: L
- Risk: Medium — no auth/payments/destructive data operations, but the product handles potentially sensitive presentation content and carries explicit security/privacy requirements (minimal permissions, no persistent clipboard/content storage, short-TTL relay, HTTPS/WSS-only transport). Transport/relay work later should route through `security-sensitive-change`.
