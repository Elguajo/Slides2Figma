import { describe, expect, it } from 'vitest';
import { buildFormatChecklist, isKnownClipboardFormat } from './formats';

describe('isKnownClipboardFormat', () => {
  it('accepts the spec-listed formats', () => {
    expect(isKnownClipboardFormat('text/plain')).toBe(true);
    expect(isKnownClipboardFormat('text/html')).toBe(true);
    expect(isKnownClipboardFormat('image/png')).toBe(true);
    expect(isKnownClipboardFormat('image/svg+xml')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isKnownClipboardFormat('application/x-vnd.google-docs-document-slice-clip+wrapped')).toBe(false);
    expect(isKnownClipboardFormat('text/rtf')).toBe(false);
  });
});

describe('buildFormatChecklist', () => {
  it('flags known and unknown formats found on the clipboard', () => {
    expect(
      buildFormatChecklist(['text/plain', 'text/html', 'application/x-custom-google-format']),
    ).toEqual([
      { mime: 'text/plain', known: true },
      { mime: 'text/html', known: true },
      { mime: 'application/x-custom-google-format', known: false },
    ]);
  });

  it('returns an empty checklist for an empty clipboard read', () => {
    expect(buildFormatChecklist([])).toEqual([]);
  });
});
