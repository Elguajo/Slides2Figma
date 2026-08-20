# Extraction Findings — Phase 01

Resolves Technical Spec §5.1/§50's per-category recoverability question and
§71's four-hypothesis funnel, using the Clipboard Inspector + MAIN-world
probe built in Phase 01 Tasks 1–5.

## Method and a scope deviation from §50

The formal 12-slide `SLIDES2FIGMA TEST SUITE` presentation (§50) did not
exist at the start of this pass. With the user's explicit sign-off, this
pass instead used an existing real-world presentation ("Your big idea", a
Made-to-Stick-style template, 21 slides) already in the user's Google
account, and mapped its actual elements onto the closest matching §5.1/§50
categories rather than waiting for a purpose-built fixture deck. This is
faster but incomplete: several categories §50 calls for (true gradient
fills, a real arrow/star/cloud/chevron shape, an explicit ellipse/circle,
overlap/z-order, a stress slide, chart/WordArt/video) simply don't occur in
this deck and are marked **untested** below, not **absent-by-design**.
Building the real fixture deck and re-running this pass remains the
recommended way to close those gaps before Phase 02 relies on this
document.

Captures were driven live against the user's real Chrome/Google session via
the already-loaded unpacked extension (Clipboard Inspector panel), using
its actual `Capture Copy` → `Download raw dump` flow. Raw dumps are saved
locally as `slides2figma-dump-*.json` (Downloads folder, per §56.4 — never
uploaded anywhere). Several captures were additionally read at full
(untruncated) fidelity directly from the OS clipboard via the same
`execCommand('paste')` technique the extension uses, since the dump file's
per-format preview is capped at 500 chars (`debug/dump.ts`'s
`PREVIEW_MAX_CHARS`) and some payloads (a 21-column table, a multi-shape
group) exceed that.

## Cross-cutting finding: resolving last session's fill-color ambiguity

Last session flagged an open question: does `drawings-object+wrapped`'s
property `15` (a hex-looking value inside a shape's style array) represent
the shape's real fill, or an unrelated default? This pass resolves it with
three independent, mutually consistent data points:

- **A real Slides *table*** (the "Milestones" timeline, disguised visually
  as a two-color bar — see Table below) has per-cell style entries
  `[29,"<objId>",[row,col,1,1],[],[14,1,15,"#27C7BD",16,1,44,1]]` and
  `...15,"#F46524"...`. These hex values **exactly match** the visibly
  rendered teal and orange cell backgrounds. `#F46524` is also the exact
  value last session's DOM probe independently confirmed for an unrelated
  orange shape via computed SVG style — two unrelated methods agreeing.
- **A genuine flat rectangle** (a plain gray placeholder box, no image,
  `shapeTypeCode 6`) has `15,"#757575"` and is visibly a solid mid-gray box
  on screen — consistent.
- **Every picture-type object** (`shapeTypeCode 3`, i.e. anything carrying
  an image blob reference in property `49`) captured this session —
  a portrait photo, a small decorative ribbon icon — also carries
  `15,"#757575",19,"#000000"`, regardless of the image's actual visible
  content (a colorful photo, a light gray icon). A *third*, differently
  cropped decorative image in the same group instead showed
  `15,"#E0E0E0",19,"#9E9E9E"`. Since `#757575`/`#000000` recurs identically
  across unrelated images with no visual gray in common, and a different
  image shows a different pair, this looks like a **default/backing shape
  fill-and-stroke pair Slides emits for every picture placeholder**, not
  real per-image color data.

**Conclusion:** property `15` (and its paired `19` = stroke) is reliable
real fill/stroke data for actual vector/table shapes, but must be
**ignored** for picture-type objects (`shapeTypeCode 3` + a `49` blob
reference) — a real extractor should read image color only from the pixel
data / rendered DOM, never from this property, for such objects.

## Cross-cutting finding: a second, friendlier clipboard format

`application/x-vnd.google-docs-document-slice-clip+wrapped` (present
alongside `drawings-object+wrapped` on every text-bearing capture) encodes
at least paragraph/list/cell styling using **named, self-describing keys**
rather than numeric opcodes, e.g. a table cell's background is literally
`{"cell_bgc2":{"clr_type":0,"hclr_color":"#27C7BD"}, "cell_pt":7, ...}`.
This is a much friendlier target for a real parser than
`drawings-object+wrapped`'s cryptic `[14,1,15,"#27C7BD",16,1,44,1]` opcode
stream, at least for table/paragraph/run-level properties. Worth
prioritizing in Phase 02's parser design; `drawings-object+wrapped` still
appears to be the only source for shape geometry (transform matrix,
`shapeTypeCode`) and image blob references.

## Per-category findings

| # | §5.1/§50 category | Status | Source | Hypothesis A verdict |
|---|---|---|---|---|
| 1 | Single-style text | **Captured** | Clipboard (`drawings-object`) | **Holds** |
| 2 | Mixed-style text | **Captured** | Clipboard (`drawings-object`) | **Holds** |
| 3 | Rectangle | **Captured** | Clipboard (`drawings-object`) | **Holds** |
| 4 | Rounded rectangle | Inconclusive | — | Not isolated standalone this pass |
| 5 | Ellipse / circle | Untested | — | Not present in this deck |
| 6 | Triangle | Untested | — | Not present in this deck |
| 7 | Line | **Captured** | Clipboard (`drawings-object`) | **Holds** |
| 8 | Arrow (real shape) | Confirmed absent as a shape | — | The deck's "➔" glyphs are text bullet characters, not shape objects |
| 9 | Gradient shape | Confirmed absent | — | What looked like a gradient bar is actually a table with solid per-cell fills (see Table row) |
| 10 | Image | **Captured** | Clipboard (`drawings-object` + `image-clip`) | **Holds**, with caveat (see fill-color finding) |
| 11 | Cropped image | **Captured** | Clipboard (`drawings-object`) | **Holds**, crop encoding present but undecoded |
| 12 | Group | **Captured** | Clipboard (`drawings-object`) | **Holds** |
| 13 | Table | **Captured** | Clipboard (`drawings-object` + `document-slice-clip`) | **Holds strongly** |
| 14 | WordArt | Untested | — | Not present in this deck |
| 15 | Chart | Untested | — | Not present in this deck |
| 16 | Multi-select | **Captured** | Clipboard (`drawings-object`) | **Holds** |
| 17 | Whole slide (Cmd+A) | **Captured** | Clipboard (`drawings-object`) | **Holds** |

### 1–2. Single-style and mixed-style text

Slide 1 title ("Making Presentations That Stick", one run, white 48pt
Raleway bold) and a slide 4 heading ("How many languages do you need to
know to communicate with the rest of the world?", two runs — white then
`#FB8C00` orange) both decode cleanly:

```
[3,"gcb9a0b074_1_1",108,[2.1105,0,0,0.514,94869,25209],[44,0],"p"]
[15,"gcb9a0b074_1_1",null,0,"Making Presentations That Stick"]
[17,"gcb9a0b074_1_1",null,0,32,[],[0,1,4,"#FFFFFF",5,"Raleway",6,48]]
```

```
[17,"gd251bb473_0_601",null,0,43,[],[0,1,4,"#FFFFFF",5,"Raleway",6,48]]
[17,"gd251bb473_0_601",null,43,84,[],[0,1,4,"#FB8C00",5,"Raleway",6,48]]
```

Confirms property `4` = run color, `5` = font family, `6` = font size, and
that run boundaries (character offsets) are preserved per style change —
matches last session's finding, now confirmed with a real multi-run case.

### 3. Rectangle

A flat gray placeholder box, `shapeTypeCode 6`, fill `#757575` matching its
visible mid-gray color (see cross-cutting finding above).

### 4. Rounded rectangle

The visually rounded-corner white "Tip" card was only captured as part of
a **group** (see #12) — drilling into the group to select the card alone
hit browser-automation instability before a clean isolated capture
completed. Its `shapeTypeCode` and corner-radius property are therefore
unconfirmed. Needs a retry, ideally against a dedicated fixture shape.

### 7. Line

A timeline connector (vertical line with round end-caps) decodes as
`shapeTypeCode 153` with line-specific properties distinct from ordinary
shapes:

```
[3,"ge965474a9_3_285",153,[0,0,0,-0.3182,22799,95759],
  [14,0,15,"#757575",18,1,19,"#000000",22,381,27,1.3,29,3,30,1.3,51,["",0],52,["",0]],"p"]
```

`shapeTypeCode 153` cleanly distinguishes it from ordinary shapes (`3`,
`6`, `108`) and table cells (`22`/`29`/`30`), confirming shape-type
discrimination works. Properties `27`/`29`/`30` are plausibly
weight/dash-style/cap — not decoded further this pass.

### 9. Gradient shape (redirected finding)

The "Milestones" slide's apparent teal→orange gradient bar is **not a
gradient-filled shape at all** — it's a genuine Google Slides **table**
(1 row × 12 columns) with columns 0–3 shaded `#27C7BD` and columns 4–11
shaded `#F46524` via per-cell background, producing the visual illusion of
a gradient/segmented bar. No real gradient fill was found in this deck;
Hypothesis A for *actual* multi-stop gradients remains untested and needs
a dedicated fixture slide (§50 Slide 03).

### 10–11. Image and cropped image

A portrait photo (`shapeTypeCode 3`) decodes with both native-asset and
crop-related properties:

```
[3,"ge965474a9_3_252",3,[57.0499,0,0,42.0221,179549,0],
  [15,"#757575",19,"#000000",22,381,49,"s-blob-v1-IMAGE-kUBd3mB7Po0",
   79,1.0176,8,3264,80,1.3814,84,-0.0176,85,-0.0932,9,4896,90,0],"p"]
```

- `8`/`9` = native pixel dimensions (3264×4896 here) — present on every
  image captured.
- `79`/`80`/`84`/`85` = present here and absent on an uncropped image
  captured earlier in the session, so these four are very likely a
  crop box (offset + scale pair per axis), but the exact mapping to
  Figma's crop transform is **not decoded** — needs comparison against a
  fixture image with a known, deliberate crop.
- `49` = an internal blob id (`s-blob-v1-IMAGE-...`), **not itself
  fetchable** — the actual asset is provided separately.
- The companion `application/x-vnd.google-docs-image-clip+wrapped` format
  carries `image_urls: { "<blob-id>": "https://docs.google.com/.../slides-images-rt/..." }`
  — a real, hosted, fetchable URL to the original image, confirming last
  session's finding and giving Phase 02 a concrete way to fetch
  full-resolution originals independent of the lossy base64 PNG also
  present in `text/html`.

### 12. Group

Selecting a "Tip" card + its decorative ribbon icon (visibly grouped —
confirmed via the right-click context menu showing "Ungroup") and copying
still yields every member object individually in `drawings-object`'s
`resolved` array (multiple `[3,...]` shape entries, each with its own
transform/fill), plus an `image-clip+wrapped` entry for the icon's blob.
Group membership itself (which objects belong to which group, and nesting)
is **not explicit** in this payload — it isn't a nested JSON structure, just
a flat list of sibling objects sharing one clipboard capture. A real
parser would need to infer grouping from the copy boundary (what was
selected together) rather than from structure in the data itself, or find
group membership elsewhere (DOM, or the Slides API in a Hypothesis C
fallback).

### 13. Table

Confirmed as a genuine first-class Slides table object, decoded from
**two independent formats in agreement**:

- `drawings-object+wrapped`: `[22,"<tableId>",[rowHeights],[colWidths],[transform],[],"p"]`
  defines the grid (1 row, 12 unequal-width columns here); each cell then
  gets its own `[29,"<tableId>",[row,col,rowSpan,colSpan],[],[14,1,15,"#hex",16,1,44,1]]`
  style entry and `[15,"<tableId>",[row,col],0,"<text>"]` / `[17,...]` for
  cell text content and run styling — same opcode scheme as shape text.
- `document-slice-clip+wrapped`: the same cell backgrounds appear as
  human-readable `{"cell_bgc2":{"hclr_color":"#27C7BD"}, "cell_pt":7, ...}`
  entries (see cross-cutting finding above) — a friendlier redundant
  source for the same data.

This is the strongest, most cleanly structured capture of the session —
tables are a good early Phase 02 target precisely because both clipboard
formats agree and the named-key format is easy to parse.

### 14–15. WordArt, Chart

Not present anywhere in this ad-hoc deck. Genuinely untested — Google
Slides has no direct WordArt equivalent, so this category may end up
resolved by Hypothesis D (PPTX) regardless; charts need a dedicated
fixture slide with a real native Slides chart object (§50 Slide 12).

### 16–17. Multi-select, whole slide

Resolved in a follow-up session via direct manual interaction (click/shift-click,
real `Cmd+C`, then the extension's `Capture Copy`) instead of the automated
navigation-heavy approach that hit `document_idle` failures previously. Both
categories decode cleanly and confirm the same mechanism §12 (Group) already
established: every selected object appears as its own sibling entry in
`drawings-object+wrapped`'s `resolved` array, in copy order, with no
container/grouping structure — the same "flat list of selected objects" shape
whether the selection came from a group, a manual multi-select, or `Cmd+A`.

- **Multi-select** (slide 2's title text + the "Made to Stick" book cover
  image, shift-clicked together): `resolved` contains `[3,"...5_27",108,...]`
  (the title, `shapeTypeCode 108` = text box) followed by the image's `[3,...]`
  entry with its own transform/fill/blob reference — two independent objects,
  each fully self-describing, confirming no cross-object relationship data is
  needed from this format beyond "these were copied together."
- **Whole slide** (`Cmd+A` on the same slide, 3 objects: title, body text,
  image): identical shape — `resolved` grows to three sibling entries, and
  `text/plain` concatenates all text content in slide order
  (`"Selling your idea\n\nCreated in partnership with Chip and Dan Heath..."`),
  which is a plausible reading-order signal a real parser could use as a
  cross-check against the transform-matrix-derived visual order.

**Root cause of last session's block, corrected:** it was not a browser-automation
stability issue as first suspected. `Capture Copy` reads whatever is *currently
on the OS clipboard* — it does not itself trigger a copy. The working sequence is
select → real `Cmd+C` (native key event, focus still on the canvas) → then click
`Capture Copy`. Clicking `Capture Copy` immediately after only a *selection* (no
intervening `Cmd+C`) silently captures a stale clipboard entry (in one repro, a
`text/link-preview` "page URL" payload left over from an earlier action) with no
error indication — a sharp edge worth fixing in the Inspector UI itself (e.g.
disable/gray out `Capture Copy` until a `copy` event has actually fired since the
last selection change) before Phase 02 or future sessions rely on this tool.

## Hypothesis A: overall verdict

**Holds** for every category actually captured across both sessions — text
(single- and mixed-style), rectangles, lines, images (with the fill-color
caveat above), groups, tables, multi-select, and whole-slide (`Cmd+A`) all
decode into concrete geometry, styling, and (for images) fetchable
original-asset URLs, directly from the clipboard, with no MAIN-world/API/PPTX
fallback needed. Nothing captured so far falsifies Hypothesis A or forces a
fallback to Hypothesis B/C/D. The remaining untested categories (rounded
rectangle standalone, ellipse, triangle, real arrow/star/cloud/chevron/
callout/wave shapes, true gradients, WordArt, chart) are gaps in *this ad-hoc
deck's coverage* (it simply doesn't contain these element types), not
evidence against Hypothesis A — closing them still requires either the
formal `SLIDES2FIGMA TEST SUITE` (§50) or another source presentation that
contains these shapes.

## Recommended next steps

1. Get access to a presentation containing the still-untested categories
   (gradients, a real arrow/ellipse/triangle, an isolated rounded rectangle,
   star/cloud/chevron/callout/wave, a chart, WordArt) — either the formal
   `SLIDES2FIGMA TEST SUITE` (§50) or another suitable deck — and re-run
   this pass's capture method against it.
2. Decode the image crop properties (`79`/`80`/`84`/`85`) against a
   fixture image with a known crop, and confirm the `8`/`9` native-size
   properties round-trip correctly.
3. Fix the Clipboard Inspector's `Capture Copy` sharp edge found this
   session: it reads the current OS clipboard rather than triggering a
   copy itself, so a selection with no intervening real `Cmd+C` silently
   captures a stale/unrelated clipboard entry with no error. Worth
   disabling the button (or otherwise signaling) until a `copy` event has
   fired since the last selection change.
4. Phase 02's parser should prioritize `document-slice-clip+wrapped`'s
   named-key encoding over `drawings-object+wrapped`'s numeric opcodes
   wherever both are present (table/paragraph/run styling), falling back
   to `drawings-object+wrapped` for geometry, shape type, and image blob
   references, which only it carries.
