import type { ClipboardCaptureResult } from '../clipboard/inspector';

/**
 * Builds and downloads the Clipboard Inspector's raw dump (Technical Spec
 * §29's dump JSON shape). Binary/file payloads are downloaded as separate
 * files rather than inlined as base64 in the JSON, per the spec's explicit
 * "binary payload сохранять отдельными файлами" -- and per §56.4/§56.6,
 * everything here stays a local browser download; nothing is sent to any
 * endpoint (no relay exists until Phase 04).
 */
const PREVIEW_MAX_CHARS = 500;

export interface DumpFormatEntry {
  mime: string;
  size: number;
  preview: string;
}

export interface Dump {
  timestamp: string;
  url: string;
  selection: string;
  formats: DumpFormatEntry[];
}

export interface DumpContext {
  url: string;
  selection: string;
  now?: Date;
}

export function buildDump(capture: ClipboardCaptureResult, context: DumpContext): Dump {
  const textEntries: DumpFormatEntry[] = capture.formats.map((format) => ({
    mime: format.mime,
    size: format.size,
    preview: format.data.length > PREVIEW_MAX_CHARS ? `${format.data.slice(0, PREVIEW_MAX_CHARS)}…` : format.data,
  }));
  const fileEntries: DumpFormatEntry[] = capture.files.map((file) => ({
    mime: file.type || 'application/octet-stream',
    size: file.size,
    preview: '(binary payload -- saved as a separate file)',
  }));

  return {
    timestamp: (context.now ?? new Date()).toISOString(),
    url: context.url,
    selection: context.selection,
    formats: [...textEntries, ...fileEntries],
  };
}

function dumpFilenameStem(timestamp: string): string {
  return `slides2figma-dump-${timestamp.replace(/[:.]/g, '-')}`;
}

function triggerDownload(blob: Blob, filename: string, doc: Document): void {
  const url = URL.createObjectURL(blob);
  const anchor = doc.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  doc.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadDump(dump: Dump, files: File[], doc: Document = document): void {
  const stem = dumpFilenameStem(dump.timestamp);
  triggerDownload(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }), `${stem}.json`, doc);

  files.forEach((file, index) => {
    const ext = (file.type.split('/')[1] ?? 'bin').split('+')[0];
    triggerDownload(file, `${stem}-${index}.${ext}`, doc);
  });
}
