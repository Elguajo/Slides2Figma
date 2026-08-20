# Roadmap — Slides2Figma

Legend: `[ ] PLANNED` · `[>] IN PROGRESS` · `[x] COMPLETE`

- [x] Phase 00 — Monorepo, Scene Schema & Fixture-Driven Figma Renderer — `.progressive/phases/00-scene-schema-renderer.md`
- [x] Phase 01 — Google Slides Extraction Research (Clipboard / Web-UI / MAIN-world) — `.progressive/phases/01-extraction-research.md`
- [ ] Phase 02 — Basic Google Slides Extraction (text/shapes/images/position/z-order → real Scene) — `.progressive/phases/02-basic-extraction.md`
- [ ] Phase 03 — High Fidelity (gradients, complex vectors, image crop, nested transforms, mixed text, effects) — `.progressive/phases/03-high-fidelity.md`
- [ ] Phase 04 — Transport (local relay → pairing → production relay/WebSocket) — `.progressive/phases/04-transport.md`
- [ ] Phase 05 — Fallbacks (Slides API adapter, SVG/raster fallback, PPTX, tables, charts, WordArt) — `.progressive/phases/05-fallbacks.md`

## Notes
- Phase order follows the Technical Spec's own recommended commit sequence (§70: monorepo → scene-schema → fixtures → renderer, *then* Chrome extension → clipboard inspector → extraction research), not its separate "Phase 0 = extraction research" label (§63). See `.progressive/phases/00-scene-schema-renderer.md` Context for the full rationale — user-confirmed 2026-08-18.
- Phase 02+ names/scope are taken directly from Technical Spec §65–§68 and are intentionally coarse; each gets a detailed phase file only once it becomes `[>]`.
- Project complete when every phase acceptance criteria is verified and every phase is `[x]`.
