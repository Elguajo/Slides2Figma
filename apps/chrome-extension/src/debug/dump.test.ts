import { describe, expect, it } from 'vitest';
import { buildDump } from './dump';
import type { ClipboardCaptureResult } from '../clipboard/inspector';

describe('buildDump', () => {
  it('maps text formats to preview entries with byte size', () => {
    const capture: ClipboardCaptureResult = {
      formats: [
        { mime: 'text/plain', data: 'hello', size: 5 },
        { mime: 'application/x-vnd.google-docs-drawings-object+wrapped', data: '{"a":1}', size: 7 },
      ],
      files: [],
    };
    const dump = buildDump(capture, {
      url: 'https://docs.google.com/presentation/d/abc/edit',
      selection: '#slide=id.g1',
      now: new Date('2026-08-19T09:00:00.000Z'),
    });

    expect(dump).toEqual({
      timestamp: '2026-08-19T09:00:00.000Z',
      url: 'https://docs.google.com/presentation/d/abc/edit',
      selection: '#slide=id.g1',
      formats: [
        { mime: 'text/plain', size: 5, preview: 'hello' },
        {
          mime: 'application/x-vnd.google-docs-drawings-object+wrapped',
          size: 7,
          preview: '{"a":1}',
        },
      ],
    });
  });

  it('truncates long previews and marks size in bytes', () => {
    const longData = 'x'.repeat(600);
    const capture: ClipboardCaptureResult = {
      formats: [{ mime: 'text/html', data: longData, size: 600 }],
      files: [],
    };
    const dump = buildDump(capture, { url: 'https://example.com', selection: '', now: new Date(0) });
    const [entry] = dump.formats;

    expect(entry?.preview).toHaveLength(501);
    expect(entry?.preview.endsWith('…')).toBe(true);
    expect(entry?.size).toBe(600);
  });

  it('represents file/binary formats without inlining their content', () => {
    const file = new File(['binarydata'], 'clip.png', { type: 'image/png' });
    const capture: ClipboardCaptureResult = { formats: [], files: [file] };
    const dump = buildDump(capture, { url: 'https://example.com', selection: '', now: new Date(0) });

    expect(dump.formats).toEqual([
      { mime: 'image/png', size: file.size, preview: '(binary payload -- saved as a separate file)' },
    ]);
  });
});
