/**
 * The Clipboard Inspector's "live format checklist" (Technical Spec §29):
 * known formats are the ones the spec's own mockup checks off by name
 * (`text/plain`, `text/html`, `image/png`, `image/svg+xml`); anything else
 * actually present on the clipboard is still surfaced, just flagged as
 * unrecognized ("?") rather than silently dropped -- this *is* the research
 * tool, so an unexpected custom/web mime type is a finding, not noise.
 */
export const KNOWN_CLIPBOARD_FORMATS = ['text/plain', 'text/html', 'image/png', 'image/svg+xml'] as const;

export type KnownClipboardFormat = (typeof KNOWN_CLIPBOARD_FORMATS)[number];

export function isKnownClipboardFormat(mime: string): mime is KnownClipboardFormat {
  return (KNOWN_CLIPBOARD_FORMATS as readonly string[]).includes(mime);
}

export interface FormatChecklistEntry {
  mime: string;
  known: boolean;
}

export function buildFormatChecklist(mimeTypes: readonly string[]): FormatChecklistEntry[] {
  return mimeTypes.map((mime) => ({ mime, known: isKnownClipboardFormat(mime) }));
}
