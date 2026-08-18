# Техническое задание: Google Slides → Figma Importer

**Рабочее название:** Slides2Figma  
**Версия ТЗ:** 0.1  
**Дата:** 18 августа 2026  
**Статус:** Ready for development / Research-first MVP

---

## 1. Цель проекта

Разработать инструмент, который переносит текущий слайд или выделенные элементы из **Google Slides Web** в **Figma Design** без ручного экспорта в PPTX/PDF/SVG.

Главная цель продукта:

> Максимально точно воспроизводить визуальную структуру Google Slides в Figma, сохраняя редактируемость всех элементов, которые технически возможно представить нативными объектами Figma.

Приоритеты:

1. **Текст должен оставаться редактируемым TextNode.**
2. **Простые шейпы должны оставаться нативными Figma shapes.**
3. **Сложные шейпы должны импортироваться как редактируемые VectorNode, а не как PNG.**
4. **Градиенты должны становиться нативными Figma gradients.**
5. **Изображения должны импортироваться как изображения с сохранением crop/position/opacity.**
6. **Группы, порядок слоёв, позиции, размеры, rotation и opacity должны сохраняться.**
7. Растеризация разрешена только как **последний fallback для конкретного неподдерживаемого элемента**, но не всего слайда.
8. Пользователь не должен вручную экспортировать презентацию в PPTX для обычного сценария.

---

## 2. Основной пользовательский сценарий

### 2.1. Google Slides

Пользователь открывает презентацию в браузере Chrome.

В панели расширения доступны:

- `Send current slide`
- `Send selection`
- `Inspect selection` — только development/debug mode
- индикатор подключения к Figma

Пример:

```text
SLIDES → FIGMA

Figma: Connected

Current slide: 07

[ SEND CURRENT SLIDE ]
[ SEND SELECTION ]
```

### 2.2. Figma

Пользователь один раз запускает Figma plugin.

Plugin показывает:

```text
SLIDES → FIGMA

● Connected
Waiting for Google Slides...

Import mode:
○ Center in viewport
● Place after previous import

[ Disconnect ]
```

После отправки Google Slides plugin получает payload и создаёт Frame с импортированным содержимым.

---

## 3. Не является целью

На первом этапе проект НЕ обязан:

- синхронизировать изменения в реальном времени;
- переносить анимации Google Slides;
- переносить speaker notes;
- импортировать комментарии;
- поддерживать совместное редактирование между Slides и Figma;
- преобразовывать Figma обратно в Google Slides;
- полностью воспроизводить поведение каждого экзотического объекта Google Slides;
- обеспечивать 100% идентичный рендеринг текста при отсутствии нужного шрифта в Figma.

---

# 4. Главный архитектурный принцип

Нельзя жёстко привязывать Figma renderer к одному способу получения данных из Google Slides.

Использовать архитектуру:

```text
Google Slides
     │
     ├── Clipboard Adapter
     ├── Web UI Adapter
     ├── Internal State Adapter      [experimental]
     ├── Google Slides API Adapter   [supplemental]
     └── PPTX Adapter                [fallback only]
              │
              ↓
      Property Resolution
              │
              ↓
      Normalized Scene Model
              │
              ↓
        Transport / Relay
              │
              ↓
         Figma Renderer
              │
              ↓
        Native Figma Nodes
```

Все источники должны приводить данные к единой **Normalized Scene Model**.

Figma renderer не должен знать, был ли элемент получен через clipboard, DOM, Google API или fallback.

---

# 5. Приоритет источников данных

## 5.1. Clipboard Adapter — P0 / главный исследовательский источник

Первым исследовать native copy Google Slides.

Цель:

1. Пользователь выделяет объект или несколько объектов.
2. Выполняется `Ctrl/Cmd + C`.
3. Extension анализирует доступные Clipboard representations.
4. Сохраняются:
   - MIME type;
   - raw Blob;
   - text payload;
   - HTML;
   - SVG;
   - custom/web formats;
   - metadata.
5. Payload сохраняется в debug dump.

Нужно проверить:

- одиночный Text;
- mixed-style Text;
- Rectangle;
- Rounded Rectangle;
- Ellipse;
- Line;
- Arrow;
- Gradient Shape;
- Image;
- Cropped Image;
- Group;
- Table;
- WordArt;
- Chart;
- несколько выделенных объектов;
- целый слайд.

### Важно

Не предполагать заранее, что Google кладёт внутренний scene graph в системный clipboard.

Это **research hypothesis**, которую необходимо подтвердить экспериментом.

Если rich/custom payload доступен — написать Parser.

Если доступен только `text/plain`, `text/html`, `image/png`, `image/svg+xml` и этого недостаточно — использовать следующие adapters.

---

# 6. Web UI Adapter

Chrome Extension должен иметь возможность запускать extraction code внутри страницы Google Slides.

Нужны два execution context:

### ISOLATED world

Для:

- extension UI;
- связи с service worker;
- storage;
- сообщений;
- безопасной логики расширения.

### MAIN world

Только для research/extraction задач, которым необходим доступ к тому же JavaScript environment, что и Google Slides.

Использовать MAIN world минимально.

Не смешивать product logic с Google-internal code.

Вся Google-specific логика должна находиться в:

```text
packages/google-slides-web-adapter/
```

При изменениях Google Slides должен заменяться только adapter, а не весь проект.

---

# 7. Internal State Adapter — experimental

Задача:

исследовать, можно ли получить из Web UI внутреннее представление текущего слайда/selection.

Разрешено исследовать:

- объекты `window`;
- DOM/SVG/canvas related objects;
- обработчики copy;
- сериализацию selection;
- данные, доступные во время copy/paste;
- application state, доступный странице.

Не использовать private implementation как единственный production source.

Любое поле, полученное через private Google internals, должно иметь:

```ts
interface ExtractedProperty<T> {
  value: T
  source: "clipboard" | "web-ui" | "internal" | "slides-api" | "pptx"
  confidence: number
}
```

Пример:

```json
{
  "value": 0.75,
  "source": "internal",
  "confidence": 0.75
}
```

---

# 8. Google Slides API Adapter

Использовать публичный Google Slides / Apps Script API как **дополнительный стабильный источник**, а не как единственный источник визуальных данных.

Полезен для:

- current slide ID;
- page IDs;
- object IDs;
- selection;
- element type;
- text content;
- basic shape metadata;
- transforms;
- page size;
- z-order;
- relationships.

Публичный API особенно полезен для связывания объекта с постоянным Google object ID.

Не полагаться на API для свойств, которые он не возвращает с достаточной точностью.

---

# 9. PPTX Adapter — fallback

PPTX не должен быть обязательным пользовательским шагом.

Он допускается как автоматический fallback, если Web/Clipboard/API не позволяют восстановить конкретное свойство.

Порядок:

```text
web extraction
     ↓
property missing?
     ↓ yes
Slides API
     ↓
still missing?
     ↓ yes
PPTX fallback
```

Если PPTX fallback требует дополнительных OAuth scopes или существенно ухудшает UX, его можно вынести в P2.

---

# 10. Normalized Scene Model

Создать независимую от Google/Figma схему.

Рекомендуемый пакет:

```text
packages/scene-schema
```

## 10.1. Scene

```ts
interface Scene {
  schemaVersion: string
  source: {
    app: "google-slides"
    presentationId?: string
    slideId?: string
    title?: string
  }

  canvas: {
    width: number
    height: number
    unit: "source"
  }

  nodes: SceneNode[]

  assets: Asset[]

  diagnostics: Diagnostic[]
}
```

---

## 10.2. Base Node

```ts
interface SceneNodeBase {
  id: string
  sourceId?: string

  type: string
  name?: string

  visible: boolean
  locked?: boolean

  zIndex: number

  transform: Transform2D

  opacity: number

  blendMode?: string

  children?: SceneNode[]

  metadata?: Record<string, unknown>
}
```

---

## 10.3. Transform

Не хранить только `x/y/width/height`.

Нужно поддерживать affine transform.

```ts
interface Transform2D {
  x: number
  y: number

  width: number
  height: number

  rotation: number

  matrix?: [
    number, number, number,
    number, number, number
  ]
}
```

Если source даёт matrix — matrix является source of truth.

---

# 11. Типы SceneNode

Минимальный набор:

```ts
type SceneNode =
  | FrameNode
  | TextNode
  | RectangleNode
  | EllipseNode
  | LineNode
  | VectorNode
  | ImageNode
  | GroupNode
  | TableNode
  | UnsupportedNode
```

---

# 12. Fill Model

```ts
type Fill =
  | SolidFill
  | LinearGradientFill
  | RadialGradientFill
  | AngularGradientFill
  | ImageFill
```

## Solid

```ts
interface SolidFill {
  type: "solid"

  color: {
    r: number
    g: number
    b: number
    a: number
  }
}
```

Цвета хранить в диапазоне `0..1`.

---

# 13. Gradient Model

Градиенты являются **P0 requirement**.

```ts
interface GradientStop {
  position: number

  color: {
    r: number
    g: number
    b: number
    a: number
  }
}

interface LinearGradientFill {
  type: "linear-gradient"

  stops: GradientStop[]

  start: { x: number; y: number }
  end: { x: number; y: number }

  rotation?: number
}

interface RadialGradientFill {
  type: "radial-gradient"

  stops: GradientStop[]

  center: { x: number; y: number }

  radiusX: number
  radiusY: number

  rotation?: number
}
```

Координаты gradient geometry хранить нормализованными относительно bounding box объекта:

```text
0,0 ───────── 1,0
 │             │
 │             │
0,1 ───────── 1,1
```

### Renderer

Преобразовывать Normalized Gradient в Figma:

- `GRADIENT_LINEAR`
- `GRADIENT_RADIAL`
- `GRADIENT_ANGULAR`
- при необходимости `GRADIENT_DIAMOND`

с расчётом `gradientTransform`.

Нельзя заменять поддерживаемый градиент картинкой.

---

# 14. Stroke Model

```ts
interface Stroke {
  color?: RGBA
  width: number

  dash?: number[]

  cap?: "none" | "round" | "square" | "arrow"
  join?: "miter" | "round" | "bevel"

  opacity?: number
}
```

Arrowheads хранить отдельно, если source предоставляет эту информацию.

---

# 15. Text Model — критический P0

Текст никогда не должен превращаться в vector/raster, если это не explicit fallback.

```ts
interface TextSceneNode extends SceneNodeBase {
  type: "text"

  text: string

  box: {
    width: number
    height: number
  }

  runs: TextRun[]

  paragraphs: ParagraphStyle[]
}
```

## TextRun

```ts
interface TextRun {
  start: number
  end: number

  fontFamily?: string
  fontStyle?: string

  fontSize?: number

  fontWeight?: number

  fill?: Fill

  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean

  letterSpacing?: number

  baselineShift?: number

  link?: string
}
```

## Paragraph

```ts
interface ParagraphStyle {
  start: number
  end: number

  align?: "left" | "center" | "right" | "justify"

  lineHeight?: number

  spaceBefore?: number
  spaceAfter?: number

  indentLeft?: number
  indentRight?: number

  direction?: "ltr" | "rtl"
}
```

---

# 16. Font Resolution

Перед созданием текста Figma renderer должен:

1. получить список доступных fonts;
2. построить font map;
3. попытаться найти exact:
   - family;
   - style;
4. затем compatible alias;
5. затем fallback.

Пример font map:

```ts
const aliases = {
  "Arial": ["Arial", "Arial MT"],
  "Roboto Medium": ["Roboto", "Medium"],
}
```

Если шрифт отсутствует:

```text
⚠ Missing font: Helvetica Neue Medium
Fallback: Inter Medium
```

В node metadata записать:

```json
{
  "slides2figma": {
    "originalFont": {
      "family": "Helvetica Neue",
      "style": "Medium"
    },
    "fontFallback": true
  }
}
```

Импорт не должен аварийно прекращаться из-за одного отсутствующего шрифта.

---

# 17. Text Rendering Strategy

Порядок создания TextNode:

1. `figma.createText()`
2. определить все уникальные fonts в runs;
3. вызвать `figma.loadFontAsync()` для доступных fonts;
4. записать `characters`;
5. задать box;
6. применить styles по ranges;
7. применить paragraph styles;
8. применить text alignment;
9. применить line height;
10. применить letter spacing;
11. применить fill;
12. применить rotation/transform.

Нужно учитывать UTF-16 ranges.

Нельзя считать количество визуальных glyphs равным `string.length`.

---

# 18. Shape Strategy

Использовать двухуровневую систему.

## Level A — Semantic Native Shape

Если shape имеет прямой эквивалент Figma:

```text
Google Rectangle → Figma RectangleNode
Google Rounded Rectangle → RectangleNode + cornerRadius
Google Ellipse → EllipseNode
Straight Line → LineNode / Vector
```

## Level B — Exact Vector

Если shape сложный:

```text
Star
Cloud
Chevron
Callout
Wave
Curved Arrow
Flowchart object
custom geometry
```

извлечь exact vector geometry и создать:

```text
VectorNode
```

или импортировать generated SVG через:

```text
figma.createNodeFromSvg(...)
```

если это даёт более точную геометрию.

Результат должен оставаться векторным и редактируемым.

---

# 19. Vector Model

```ts
interface VectorSceneNode extends SceneNodeBase {
  type: "vector"

  pathData?: string

  svg?: string

  fill?: Fill[]
  strokes?: Stroke[]
}
```

Приоритет:

1. exact path geometry;
2. exact SVG;
3. approximation;
4. raster fallback.

---

# 20. Images

```ts
interface ImageSceneNode extends SceneNodeBase {
  type: "image"

  assetId: string

  crop?: {
    x: number
    y: number
    width: number
    height: number
  }

  fit?: "fill" | "fit" | "crop"

  filters?: {
    exposure?: number
    contrast?: number
    saturation?: number
    temperature?: number
    tint?: number
  }
}
```

Assets:

```ts
interface Asset {
  id: string

  mimeType: string

  bytes?: string
  url?: string

  width?: number
  height?: number

  sha256?: string
}
```

Base64 допустим только для small/debug payload.

Для production больших изображений использовать asset upload/relay.

---

# 21. Image Import in Figma

Создать `Image` через bytes.

После этого создать RectangleNode и применить ImagePaint.

Сохранять:

- crop;
- opacity;
- rotation;
- scale mode;
- filters, если есть прямое соответствие.

Если exact crop transform можно вычислить, использовать Figma image transform вместо предварительной растеризации.

---

# 22. Groups

Google group:

```text
Group
 ├── Shape
 ├── Text
 └── Image
```

должен стать:

```text
Group / Frame
 ├── Shape
 ├── Text
 └── Image
```

Нужно сохранять:

- children order;
- relative transforms;
- group transform;
- opacity;
- clipping, если существует.

Не flatten group.

---

# 23. Z-order

Node array должна быть упорядочена однозначно.

В Normalized Scene хранить:

```ts
zIndex: number
```

Figma renderer создаёт children в правильной последовательности или затем выполняет reorder.

Тестировать overlap.

---

# 24. Unsupported Elements

```ts
interface UnsupportedNode extends SceneNodeBase {
  type: "unsupported"

  sourceType: string

  fallback?: {
    type: "svg" | "image"
    assetId?: string
    svg?: string
  }

  reason: string
}
```

Правило:

> Никогда не превращать весь slide в bitmap только потому, что один child unsupported.

---

# 25. Property Resolution Engine

Разные adapters могут возвращать разные части одного объекта.

Нужен resolver:

```text
Clipboard → gradient
API       → text
Web UI    → geometry
PPTX      → shadow
```

↓

```text
one resolved SceneNode
```

Для каждого свойства учитывать:

- source;
- confidence;
- completeness;
- parser version.

Пример:

```ts
resolveProperty([
  { value: "...", source: "clipboard", confidence: 0.95 },
  { value: "...", source: "slides-api", confidence: 1.0 }
])
```

### Default precedence

Не задавать один глобальный precedence для всех properties.

Использовать property-specific policy.

Пример:

```text
Object ID:
Slides API > Clipboard > Internal

Text content:
Slides API / Clipboard > DOM

Gradient:
Clipboard/Internal > PPTX > approximation

Geometry:
Clipboard/Internal/Web renderer > API > PPTX

Images:
direct original asset > API contentUrl > screenshot fallback
```

---

# 26. Chrome Extension

## Manifest

Использовать:

```text
Manifest V3
```

Минимально необходимые permissions:

```json
{
  "permissions": [
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://docs.google.com/presentation/*"
  ]
}
```

`clipboardRead` добавлять только если Clipboard Inspector действительно требует его.

Не запрашивать лишние permissions заранее.

### Development build

Можно включить:

```text
clipboardRead
clipboardWrite
```

для исследования.

Production permissions сократить после Phase 0.

---

# 27. Chrome Extension Modules

```text
apps/chrome-extension/
  src/
    background/
      service-worker.ts

    content/
      bridge.ts
      ui.ts

    injected/
      main-world.ts

    clipboard/
      inspector.ts
      formats.ts
      parser.ts

    google/
      selection.ts
      slide-context.ts

    transport/
      relay-client.ts

    debug/
      dump.ts

    shared/
```

---

# 28. Communication Between Worlds

MAIN world не должен напрямую иметь доступ к extension secrets/state.

Использовать bridge:

```text
MAIN WORLD
    ↓
window.postMessage
    ↓
ISOLATED CONTENT SCRIPT
    ↓
chrome.runtime.sendMessage
    ↓
SERVICE WORKER
```

Все messages валидировать по schema.

Не принимать arbitrary commands из `window.postMessage`.

Пример:

```ts
type MainWorldMessage = {
  channel: "slides2figma"
  version: 1
  type: "EXTRACT_RESULT"
  payload: unknown
}
```

После получения обязательно Zod/JSON Schema validation.

---

# 29. Clipboard Inspector — первая задача разработки

До написания большого importer сделать отдельный research tool.

## UI

```text
SLIDES CLIPBOARD INSPECTOR

Selection detected

[ CAPTURE COPY ]

Formats:
✓ text/plain
✓ text/html
✓ image/png
? web ...
? custom ...

[ Download raw dump ]
```

## Dump

```json
{
  "timestamp": "...",
  "url": "...",
  "selection": "...",
  "formats": [
    {
      "mime": "text/html",
      "size": 12345,
      "preview": "..."
    }
  ]
}
```

Binary payload сохранять отдельными файлами.

### Запрещено

Не логировать clipboard постоянно в production.

Capture только после явного действия пользователя.

---

# 30. Experimental Network Inspection

Не включать Chrome DevTools/Debugger API в production MVP без необходимости.

Если для research потребуется network protocol inspection, сделать отдельную development-only extension/build:

```text
tools/slides-network-inspector/
```

Причины:

- повышенные permissions;
- security warning;
- сложнее публикация;
- высокая хрупкость;
- private Google protocol.

Production importer не должен зависеть исключительно от debugger API.

---

# 31. Transport Layer

Рекомендуемый production flow:

```text
Chrome Extension
      ↓
     HTTPS
      ↓
  Relay Service
      ↓
 WebSocket / polling
      ↓
 Figma Plugin UI
      ↓
 Plugin Controller
```

## Pairing

Chrome и Figma получают общий session ID.

Например:

```text
Figma:
Pair code 482193
```

Chrome:

```text
Enter pairing code:
482193
```

После pairing:

```text
sessionToken
```

### Требования

- random cryptographic token;
- короткоживущий pairing code;
- session revocation;
- TLS only;
- payload TTL;
- никаких presentation dumps в permanent DB по умолчанию.

---

# 32. Relay API

Минимальный API:

```http
POST /v1/pair/create
POST /v1/pair/claim
POST /v1/sessions/:id/scenes
GET  /v1/sessions/:id/scenes/latest
DELETE /v1/sessions/:id
```

Лучше WebSocket:

```text
wss://relay.example.com/v1/session/:id
```

Messages:

```ts
type RelayMessage =
  | { type: "scene"; scene: Scene }
  | { type: "ack"; sceneId: string }
  | { type: "error"; code: string; message: string }
  | { type: "ping" }
```

---

# 33. Локальный режим разработки

До production relay сделать local transport:

```text
Chrome Extension
       ↓
http://localhost:4317
       ↓
local relay
       ↓
Figma Plugin
```

Это позволяет быстро отлаживать converter.

В production localhost должен быть удалён из allowed domains.

---

# 34. Figma Plugin

Структура:

```text
apps/figma-plugin/
  src/
    plugin/
      main.ts

    ui/
      App.tsx

    transport/
      client.ts

    renderer/
      scene-renderer.ts
      text-renderer.ts
      shape-renderer.ts
      vector-renderer.ts
      image-renderer.ts
      gradient-renderer.ts

    fonts/
      resolver.ts

    diagnostics/
      reporter.ts
```

---

# 35. Figma Manifest

Target:

```json
{
  "editorType": ["figma"]
}
```

Если позже понадобится Figma Slides — добавить отдельно после тестирования.

Network access разрешать только relay domain.

Development:

```text
devAllowedDomains:
http://localhost:4317
ws://localhost:4317
```

Production:

```text
https://relay.domain
wss://relay.domain
```

---

# 36. Figma Render Pipeline

```text
receive Scene
    ↓
validate schema
    ↓
load assets
    ↓
resolve fonts
    ↓
create root Frame
    ↓
sort nodes by zIndex
    ↓
recursive render
    ↓
apply transforms
    ↓
apply fills/strokes/effects
    ↓
apply text runs
    ↓
apply metadata
    ↓
select root frame
    ↓
viewport.scrollAndZoomIntoView()
```

Если один child падает — importer продолжает работу.

Ошибка превращается в diagnostic.

---

# 37. Root Frame

Root Frame:

```text
name = Google Slides / Slide 07
width = targetWidth
height = targetHeight
```

Metadata:

```json
{
  "slides2figma": {
    "schemaVersion": "0.1",
    "presentationId": "...",
    "slideId": "...",
    "importedAt": "...",
    "source": "google-slides"
  }
}
```

---

# 38. Coordinate System

Normalized Scene хранит исходные presentation coordinates.

При импорте вычислить:

```ts
scaleX = targetWidth / scene.canvas.width
scaleY = targetHeight / scene.canvas.height
```

По умолчанию:

```text
preserveAspectRatio = true
```

Для standard 16:9 можно использовать target:

```text
1920 × 1080
```

Но target size должен быть configurable.

Важнее сохранить относительную геометрию, чем конкретное число pixels.

---

# 39. Rotation / Affine Transform

Нужно тестировать:

- rotate;
- negative scale / flip;
- nested group transforms;
- skew, если встречается;
- transforms у изображения после crop.

Нельзя считать, что каждый объект описывается только:

```text
x
y
width
height
rotation
```

Renderer должен поддерживать matrix conversion там, где это возможно.

---

# 40. Effects

Приоритет после базовой геометрии:

- drop shadow;
- inner shadow;
- blur;
- opacity.

Если точного аналога нет:

1. приблизить native effect;
2. пометить diagnostic;
3. element-level fallback только при критической разнице.

---

# 41. Tables

P1/P2.

Первый вариант:

```text
Google Table
   ↓
Figma Frame
   ├ cell
   ├ cell
   ├ cell
```

Каждая cell:

```text
Rectangle + Text
```

Сохранять:

- rows;
- columns;
- cell fills;
- borders;
- text;
- merge;
- padding;
- alignment.

Не импортировать table как один PNG, если её можно разложить.

---

# 42. Charts

P2.

Приоритет:

1. получить vector representation;
2. импортировать как grouped vectors/text;
3. если невозможно — SVG;
4. только затем image fallback.

Не обещать editable chart-data model в MVP.

---

# 43. WordArt

P2.

Приоритет:

```text
exact vector outline
```

WordArt необязательно сохранять как editable text, если визуальный эффект зависит от geometry.

Diagnostic:

```text
WordArt imported as vector.
```

---

# 44. Video

P2/P3.

В MVP:

- placeholder;
- thumbnail;
- link metadata.

Не блокирует slide import.

---

# 45. Diagnostics

После каждого импорта пользователь должен видеть отчёт.

Пример:

```text
Imported: Slide 07

✓ 12 text nodes
✓ 8 shapes
✓ 3 gradients
✓ 4 images
✓ 2 groups

⚠ 1 missing font
⚠ 1 WordArt converted to vector
```

Diagnostic model:

```ts
interface Diagnostic {
  severity: "info" | "warning" | "error"

  nodeId?: string
  sourceId?: string

  code: string
  message: string

  details?: unknown
}
```

---

# 46. Source Metadata

Каждая Figma node должна по возможности хранить:

```text
sourceId
sourceType
parserVersion
```

через plugin data.

Это понадобится для будущего:

```text
Update existing import
```

---

# 47. Future Sync Architecture

Не реализовать сейчас, но не закрывать архитектурно.

В будущем:

```text
Google sourceId
      ↕
Figma pluginData.sourceId
```

Кнопка:

```text
UPDATE IN FIGMA
```

должна находить существующие nodes и обновлять их вместо создания дублей.

Для этого source IDs необходимо сохранять уже в MVP.

---

# 48. Repository

Рекомендуемый monorepo:

```text
slides2figma/
│
├ apps/
│  ├ chrome-extension/
│  └ figma-plugin/
│
├ services/
│  └ relay/
│
├ packages/
│  ├ scene-schema/
│  ├ property-resolver/
│  ├ google-slides-web-adapter/
│  ├ google-slides-api-adapter/
│  ├ clipboard-parser/
│  ├ pptx-adapter/
│  ├ figma-renderer/
│  └ shared/
│
├ tools/
│  ├ clipboard-inspector/
│  └ test-fixture-generator/
│
├ fixtures/
│  ├ basic/
│  ├ text/
│  ├ gradients/
│  ├ vectors/
│  ├ images/
│  └ stress/
│
└ docs/
```

---

# 49. Рекомендуемый стек

Основной язык:

```text
TypeScript
```

Browser:

```text
Chrome Extension Manifest V3
```

Figma:

```text
Figma Plugin API
```

Schema validation:

```text
Zod
```

Testing:

```text
Vitest
```

UI:

```text
React
```

UI необязателен для первого Inspector, если vanilla HTML быстрее.

Relay:

```text
Node.js / TypeScript
```

Transport:

```text
WebSocket + HTTPS
```

Package management:

```text
pnpm workspace
```

Не привязывать архитектуру к конкретному frontend framework.

---

# 50. Test Presentation

Создать отдельную Google Slides presentation:

```text
SLIDES2FIGMA TEST SUITE
```

## Slide 01 — Basic shapes

- rectangle;
- rounded rectangle;
- circle;
- ellipse;
- triangle;
- line;
- arrow.

## Slide 02 — Solid fills

- RGB colors;
- transparency;
- stroke;
- different stroke width.

## Slide 03 — Gradients

- 2-stop linear;
- 4-stop linear;
- diagonal linear;
- radial;
- transparent gradient stop;
- gradient + opacity;
- gradient + stroke.

## Slide 04 — Text

- single style;
- bold;
- italic;
- mixed font size;
- mixed colors;
- mixed font family;
- letter spacing;
- line spacing;
- paragraph alignments.

## Slide 05 — Text boxes

- fixed width;
- multiline;
- overflow;
- center alignment;
- vertical positioning.

## Slide 06 — Images

- normal;
- cropped;
- resized;
- rotated;
- transparent;
- image inside composition.

## Slide 07 — Groups

- nested group;
- rotated group;
- group with text + image + shape.

## Slide 08 — Advanced shapes

- star;
- cloud;
- chevron;
- callout;
- curved arrow;
- wave.

## Slide 09 — Overlap

Проверка z-order.

## Slide 10 — Stress

50–100 mixed elements.

## Slide 11 — Fonts

- common Google font;
- uncommon font;
- missing-in-Figma font.

## Slide 12 — Unsupported

- chart;
- WordArt;
- video;
- table.

---

# 51. Visual Fidelity Testing

Для каждого fixture хранить:

```text
source reference
normalized scene dump
import diagnostics
Figma screenshot
diff result
```

Цель — различать:

```text
Extraction Error
```

и

```text
Rendering Error
```

Если normalized scene правильная, а Figma визуально отличается — ошибка renderer.

Если normalized scene уже неверна — ошибка adapter/parser.

---

# 52. Acceptance Criteria P0

P0 считается успешным, если:

### Text

- обычный текст импортируется как Figma TextNode;
- mixed text сохраняется ranges;
- текст можно вручную отредактировать после импорта;
- font family/style сохраняются при наличии шрифта;
- missing font не ломает импорт;
- line breaks сохраняются;
- alignment сохраняется.

### Shapes

- rectangle/rounded rectangle/ellipse импортируются нативно;
- complex shape импортируется как VectorNode/SVG, а не bitmap;
- fill/stroke/opacity сохраняются;
- rotation сохраняется.

### Gradients

- linear gradient импортируется нативным Figma gradient;
- все stops сохраняются;
- stop opacity сохраняется;
- direction/angle визуально совпадает;
- radial gradient импортируется нативно, если source data доступна.

### Images

- image остаётся image;
- crop визуально совпадает;
- rotation и opacity сохраняются.

### Structure

- z-order совпадает;
- groups сохраняются;
- root slide становится Frame;
- unsupported child не приводит к rasterization всего slide.

---

# 53. Геометрическая точность

На тестовом frame 1920×1080:

Для базовых элементов ориентир:

```text
median position error <= 1 px
P95 position error <= 2 px
```

Для bounding boxes текста при наличии exact font:

```text
<= 2 px
```

Для сложных vector geometry допускается renderer difference, но outline должен визуально совпадать.

Эти значения являются target quality metric, а не причиной аварийно отклонять импорт.

---

# 54. Gradient Accuracy

Для parsed stops:

```text
stop count: exact
stop positions: exact or <= 0.001 error
RGBA: exact after color-space normalization
```

Для gradient direction:

```text
visual direction difference <= 1 degree
```

если source предоставляет точный angle.

---

# 55. Structural Fidelity Metric

В debug mode рассчитывать:

```text
supported source elements
native Figma elements
vector fallbacks
raster fallbacks
failed elements
```

Пример:

```text
Structural fidelity

Native: 91%
Vector fallback: 8%
Raster fallback: 1%
Failed: 0%
```

Главная метрика продукта:

> уменьшать Raster fallback.

---

# 56. Security

Презентации потенциально содержат конфиденциальные данные.

Обязательные правила:

1. Не читать presentation без явного пользовательского действия.
2. Не мониторить clipboard постоянно.
3. Не сохранять clipboard history.
4. Не писать raw slide payload в analytics.
5. Relay payload удалять после short TTL.
6. Не логировать text content в production.
7. Все network requests — HTTPS/WSS.
8. Session token генерировать криптографически безопасно.
9. Pairing code должен быстро истекать.
10. Пользователь должен иметь `Disconnect / Clear session`.
11. Минимизировать Chrome permissions.
12. MAIN-world extraction не должен исполнять remote code.

---

# 57. Privacy Modes

Позже предусмотреть:

```text
Cloud Relay
Local Relay
Clipboard Transfer
```

Local Relay может быть полезен компаниям, которым нельзя отправлять slide data через сторонний сервер.

---

# 58. Error Handling

Importer не должен быть all-or-nothing.

Пример:

```text
Text ✓
Shape ✓
Image ✕
Gradient ✓
```

Slide всё равно создаётся.

Проблемный child заменяется placeholder:

```text
[ Unsupported Image ]
```

или fallback asset.

Diagnostic содержит причину.

---

# 59. Performance

Основной import не должен создавать отдельный network request на каждое маленькое свойство.

Scene отправляется пакетно.

Assets могут передаваться отдельно.

Использовать:

- hashing;
- deduplication;
- caching;
- concurrent font loading;
- concurrent asset loading с лимитом.

Большие base64 blobs не хранить в JSON без необходимости.

---

# 60. Asset Deduplication

Если одно изображение используется 10 раз:

```text
asset stored once
nodes reference assetId
```

Hash:

```text
SHA-256
```

---

# 61. Versioning

Scene payload:

```json
{
  "schemaVersion": "0.1.0"
}
```

Adapters:

```text
clipboardParserVersion
webAdapterVersion
figmaRendererVersion
```

Нельзя менять schema breaking-change без version bump.

---

# 62. Debug Mode

Chrome:

```text
Show raw clipboard types
Show raw object data
Download extraction dump
Show adapter sources
```

Figma:

```text
Show sourceId
Show normalized node
Show mapping
Show diagnostic
```

Production UI должен быть простым.

Debug UI может быть подробным.

---

# 63. Phase 0 — Extraction Research

**Не начинать с полноценного продукта.**

Сначала ответить на главный вопрос:

> Что именно можно получить из Google Slides Web без PPTX?

Задачи:

- [ ] создать Chrome MV3 extension;
- [ ] добавить content script;
- [ ] добавить MAIN-world injected script;
- [ ] создать Clipboard Inspector;
- [ ] capture `ClipboardItem.types`;
- [ ] capture `copy` event formats;
- [ ] сохранить raw dumps;
- [ ] протестировать все fixture elements;
- [ ] определить, где находятся gradients;
- [ ] определить, где находится text run styling;
- [ ] определить, можно ли получить exact shape path;
- [ ] определить способ получения original image;
- [ ] документировать findings.

Результат Phase 0:

```text
docs/extraction-findings.md
```

---

# 64. Phase 1 — Scene Schema + Figma Renderer

Не ждать готового Google extractor.

Создать вручную fixture JSON:

```text
fixtures/basic/rectangle.json
fixtures/text/mixed-text.json
fixtures/gradients/linear.json
```

И по ним построить Figma renderer.

Задачи:

- [ ] scene schema;
- [ ] validation;
- [ ] Frame;
- [ ] Rectangle;
- [ ] Ellipse;
- [ ] Vector;
- [ ] Solid fill;
- [ ] Linear gradient;
- [ ] Radial gradient;
- [ ] Stroke;
- [ ] Text;
- [ ] Text ranges;
- [ ] Font resolver;
- [ ] Images;
- [ ] Groups;
- [ ] z-order;
- [ ] diagnostics.

Результат:

> Figma renderer способен создать правильный slide из JSON, даже если extractor ещё не готов.

---

# 65. Phase 2 — Basic Google Slides Extraction

Связать extractor с scene schema.

Поддержать:

- [ ] current slide;
- [ ] selection;
- [ ] basic text;
- [ ] basic shapes;
- [ ] images;
- [ ] position;
- [ ] size;
- [ ] rotation;
- [ ] solid fills;
- [ ] z-order.

---

# 66. Phase 3 — High Fidelity

Добавить:

- [ ] gradients;
- [ ] complex vectors;
- [ ] image crop;
- [ ] nested transforms;
- [ ] mixed text styling;
- [ ] paragraph styles;
- [ ] effects;
- [ ] advanced groups.

---

# 67. Phase 4 — Transport

Добавить:

- [ ] local relay;
- [ ] pairing;
- [ ] production relay;
- [ ] WebSocket;
- [ ] reconnect;
- [ ] ack;
- [ ] retry;
- [ ] session cleanup.

---

# 68. Phase 5 — Fallbacks

Добавить только после понимания реальных gaps:

- [ ] Google Slides API supplemental adapter;
- [ ] SVG fallback;
- [ ] element raster fallback;
- [ ] PPTX fallback;
- [ ] tables;
- [ ] charts;
- [ ] WordArt.

---

# 69. Definition of Done для первого полезного MVP

MVP можно использовать в реальной работе, когда пользователь может:

1. открыть обычный Google Slides design slide;
2. нажать `Send current slide`;
3. получить Figma Frame;
4. кликнуть на заголовок и отредактировать текст;
5. кликнуть на rectangle и изменить fill;
6. открыть gradient в Figma и изменить stops;
7. переместить изображение;
8. изменить vector shape;
9. разгруппировать группы;
10. получить визуально очень близкий исходнику результат.

Если результат состоит преимущественно из SVG/PNG без нормальных editable layers — MVP не считается выполненным.

---

# 70. Первый development sprint: конкретный порядок

Рекомендуемый порядок первых коммитов:

```text
01 init monorepo
02 scene-schema
03 fixture-scenes
04 figma-plugin-shell
05 figma-render-rectangle
06 figma-render-text
07 figma-render-gradients
08 figma-render-vector
09 figma-render-images
10 chrome-extension-shell
11 clipboard-inspector
12 copy-event-dump
13 main-world-probe
14 extraction-findings
15 first-google-text-parser
16 first-google-shape-parser
17 end-to-end-local-relay
```

Не начинать сразу с cloud auth, billing, analytics или красивого UI.

Сначала доказать качество extraction + rendering.

---

# 71. Первая техническая гипотеза, которую нужно проверить

**Hypothesis A**

Google Slides copy operation содержит rich representation, достаточное для восстановления части native scene.

Если true:

```text
Clipboard Parser
    ↓
Normalized Scene
    ↓
Figma
```

становится основным route.

Если false:

**Hypothesis B**

В MAIN-world / renderer state можно получить недостающие properties.

Если false:

**Hypothesis C**

Публичный API + DOM/SVG + targeted fallback дают достаточную fidelity.

И только затем:

**Hypothesis D**

PPTX используется для properties, которые иначе получить нельзя.

---

# 72. Критическое архитектурное правило

Нельзя писать код вида:

```ts
if (googleShape.type === "...") {
  figma.create...
}
```

прямо внутри Chrome extension.

Должно быть:

```text
GOOGLE
  ↓ adapter
SCENE MODEL
  ↓ renderer
FIGMA
```

Это позволит позднее добавить:

```text
PowerPoint → Scene → Figma
Keynote → Scene → Figma
Canva → Scene → Figma
```

не переписывая renderer.

---

# 73. Возможное развитие продукта

После стабильного Slides importer:

### v0.2

```text
Send selection
```

### v0.3

```text
Update existing frame
```

### v0.4

```text
Auto Sync
```

### v0.5

```text
Figma → Google Slides
```

### v1

Универсальный presentation bridge:

```text
Google Slides
PowerPoint
Keynote
Canva
        ↓
   Scene Engine
        ↓
      Figma
```

---

# 74. Главный критерий принятия архитектурных решений

При конфликте между:

```text
Pixel perfect
```

и

```text
Editable
```

использовать следующий порядок:

1. Native + visually exact
2. Native + visually very close
3. Vector + visually exact
4. Vector + visually close
5. Raster element fallback
6. Failure

Никогда не выбирать raster только потому, что это проще реализовать.

---

# 75. References / официальная документация

Chrome Extensions:

- Chrome `scripting` API и MAIN/ISOLATED execution world:  
  https://developer.chrome.com/docs/extensions/reference/api/scripting
- Chrome Content Scripts:  
  https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- Chrome Extension permissions / `clipboardRead`:  
  https://developer.chrome.com/docs/extensions/reference/permissions-list
- Web custom formats for Async Clipboard API:  
  https://developer.chrome.com/blog/web-custom-formats-for-the-async-clipboard-api

Google Slides:

- Apps Script Selection (`getCurrentPage`, `getPageElementRange`):  
  https://developers.google.com/apps-script/reference/slides/selection
- Google Slides API element operations:  
  https://developers.google.com/workspace/slides/api/samples/elements
- Google Slides shapes model:  
  https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations.pages/shapes
- Google Slides transforms:  
  https://developers.google.com/workspace/slides/api/samples/transform

Figma:

- Figma Plugin API:  
  https://developers.figma.com/docs/plugins/api/figma/
- `createText`:  
  https://developers.figma.com/docs/plugins/api/properties/figma-createtext/
- `loadFontAsync`:  
  https://developers.figma.com/docs/plugins/api/properties/figma-loadfontasync/
- Paint / GradientPaint / ImagePaint:  
  https://developers.figma.com/docs/plugins/api/Paint/
- Network requests:  
  https://developers.figma.com/docs/plugins/making-network-requests/
- Plugin manifest:  
  https://developers.figma.com/docs/plugins/manifest/

---

# 76. Итог

Первая версия проекта должна доказать три вещи:

```text
1. Google Slides Web можно достаточно глубоко разобрать без ручного PPTX export.

2. Полученные данные можно привести к стабильной независимой Scene Model.

3. Scene Model можно восстановить в Figma преимущественно нативными editable nodes.
```

Главный принцип проекта:

> **Extract as much semantic structure as possible, preserve visual fidelity, rasterize only as a last resort.**

Если Phase 0 покажет, что clipboard или web-internal representation содержит богатую структуру объектов, этот путь становится основным.

Если Google не предоставляет необходимые данные напрямую через Web UI, архитектура не ломается: отдельные properties добираются через публичный Slides API или fallback adapters.

Это позволяет разрабатывать продукт итеративно, не связывая весь проект с одним нестабильным методом extraction.
