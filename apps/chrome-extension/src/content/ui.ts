import { buildFormatChecklist } from '../clipboard/formats';
import { captureClipboardFormats, type ClipboardCaptureResult } from '../clipboard/inspector';
import { buildDump, downloadDump } from '../debug/dump';
import { createDomShapeStyleLookup, probeShapeFill, probeShapeStroke } from '../google/dom-probe';
import { observeSelection } from '../google/selection';
import { currentSlideId } from '../google/slide-context';

/**
 * The Clipboard Inspector panel (Technical Spec §29). Mounted in a Shadow
 * DOM host so its styles can never leak into (or be overridden by) Google's
 * own page CSS in either direction. ISOLATED-world content script -- no
 * MAIN-world access needed here, clipboard capture and DOM
 * selection-marker/shape-style lookups all work fine from this world.
 */
const HOST_ID = 'slides2figma-inspector-host';

function mountPanel(): void {
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement('div');
  host.id = HOST_ID;
  Object.assign(host.style, {
    all: 'initial',
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: '2147483647',
  } satisfies Partial<CSSStyleDeclaration>);
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      .panel {
        all: initial;
        display: block;
        font-family: system-ui, sans-serif;
        font-size: 12px;
        width: 240px;
        background: #202124;
        color: #e8eaed;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
      }
      .title { font-weight: 600; letter-spacing: 0.02em; margin-bottom: 8px; }
      .section-title { font-weight: 600; opacity: 0.7; margin: 10px 0 6px; font-size: 11px; text-transform: uppercase; }
      .status { margin-bottom: 8px; opacity: 0.85; }
      .status.active { color: #81c995; }
      button {
        all: unset;
        display: block;
        text-align: center;
        cursor: pointer;
        background: #8ab4f8;
        color: #202124;
        font-weight: 600;
        border-radius: 4px;
        padding: 6px 0;
        margin-bottom: 8px;
      }
      button:disabled { opacity: 0.6; cursor: default; }
      .formats { display: flex; flex-direction: column; gap: 2px; word-break: break-all; margin-bottom: 8px; }
      .formats .row.known { color: #81c995; }
      .formats .row.unknown { color: #fdd663; }
      input {
        all: unset;
        display: block;
        box-sizing: border-box;
        width: 100%;
        background: #303134;
        color: #e8eaed;
        border-radius: 4px;
        padding: 6px 8px;
        margin-bottom: 8px;
        font-family: monospace;
      }
      .probe-result { word-break: break-all; }
      .probe-result div { margin-bottom: 2px; }
    </style>
    <div class="panel">
      <div class="title">SLIDES CLIPBOARD INSPECTOR</div>
      <div class="status" data-role="status">No selection</div>
      <button type="button" data-role="capture">CAPTURE COPY</button>
      <div class="formats" data-role="formats">—</div>
      <button type="button" data-role="download" disabled>Download raw dump</button>

      <div class="section-title">DOM probe (by object id)</div>
      <input type="text" data-role="probe-input" placeholder="e.g. g3f3e9b265d8_6_0" />
      <button type="button" data-role="probe">Probe fill / stroke</button>
      <div class="probe-result" data-role="probe-result">—</div>
    </div>
  `;

  const statusElOrNull = shadow.querySelector<HTMLElement>('[data-role="status"]');
  const formatsElOrNull = shadow.querySelector<HTMLElement>('[data-role="formats"]');
  const captureButtonOrNull = shadow.querySelector<HTMLButtonElement>('[data-role="capture"]');
  const downloadButtonOrNull = shadow.querySelector<HTMLButtonElement>('[data-role="download"]');
  const probeInputOrNull = shadow.querySelector<HTMLInputElement>('[data-role="probe-input"]');
  const probeButtonOrNull = shadow.querySelector<HTMLButtonElement>('[data-role="probe"]');
  const probeResultOrNull = shadow.querySelector<HTMLElement>('[data-role="probe-result"]');
  if (
    !statusElOrNull ||
    !formatsElOrNull ||
    !captureButtonOrNull ||
    !downloadButtonOrNull ||
    !probeInputOrNull ||
    !probeButtonOrNull ||
    !probeResultOrNull
  ) {
    return;
  }

  // Rebind as non-null: TS control-flow narrowing from the guard above does
  // not extend into the nested closures below.
  const statusEl: HTMLElement = statusElOrNull;
  const formatsEl: HTMLElement = formatsElOrNull;
  const captureButton: HTMLButtonElement = captureButtonOrNull;
  const downloadButton: HTMLButtonElement = downloadButtonOrNull;
  const probeInput: HTMLInputElement = probeInputOrNull;
  const probeButton: HTMLButtonElement = probeButtonOrNull;
  const probeResult: HTMLElement = probeResultOrNull;

  let lastCapture: ClipboardCaptureResult | null = null;
  const shapeStyleLookup = createDomShapeStyleLookup(document);

  observeSelection((active) => {
    statusEl.textContent = active ? 'Selection detected' : 'No selection';
    statusEl.classList.toggle('active', active);
  }, document);

  captureButton.addEventListener('click', () => {
    void handleCapture();
  });

  downloadButton.addEventListener('click', () => {
    if (!lastCapture) return;
    const slideId = currentSlideId(window.location);
    const dump = buildDump(lastCapture, {
      url: window.location.href,
      selection: slideId?.value ?? window.location.hash,
    });
    downloadDump(dump, lastCapture.files);
  });

  probeButton.addEventListener('click', () => {
    const objectId = probeInput.value.trim();
    if (!objectId) {
      probeResult.textContent = 'Enter an object id first (from a drawings-object+wrapped dump).';
      return;
    }

    const fill = probeShapeFill(objectId, shapeStyleLookup);
    const stroke = probeShapeStroke(objectId, shapeStyleLookup);
    if (!fill && !stroke) {
      probeResult.textContent = `No "editor-${objectId}" shape found on the current slide.`;
      return;
    }

    probeResult.innerHTML = '';
    for (const [label, prop] of [
      ['fill', fill],
      ['stroke', stroke],
    ] as const) {
      const row = document.createElement('div');
      row.textContent = prop
        ? `${label}: ${prop.value} (source: ${prop.source}, confidence: ${prop.confidence})`
        : `${label}: none`;
      probeResult.appendChild(row);
    }
  });

  async function handleCapture(): Promise<void> {
    captureButton.disabled = true;
    downloadButton.disabled = true;
    lastCapture = null;
    formatsEl.textContent = 'Reading clipboard…';

    const outcome = await captureClipboardFormats();

    captureButton.disabled = false;

    if (!outcome.ok) {
      formatsEl.textContent = `Error: ${outcome.error}`;
      return;
    }

    lastCapture = outcome.result;
    const mimeTypes = [
      ...outcome.result.formats.map((format) => format.mime),
      ...outcome.result.files.map((file) => file.type || 'application/octet-stream'),
    ];
    const checklist = buildFormatChecklist(mimeTypes);
    if (checklist.length === 0) {
      formatsEl.textContent = 'No formats found on clipboard.';
      return;
    }

    formatsEl.innerHTML = '';
    for (const entry of checklist) {
      const row = document.createElement('div');
      row.className = `row ${entry.known ? 'known' : 'unknown'}`;
      row.textContent = `${entry.known ? '✓' : '?'} ${entry.mime}`;
      formatsEl.appendChild(row);
    }
    downloadButton.disabled = false;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountPanel, { once: true });
} else {
  mountPanel();
}
