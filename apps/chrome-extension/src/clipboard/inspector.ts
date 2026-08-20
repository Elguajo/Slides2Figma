/**
 * Reads whatever the user already placed on the system clipboard via their
 * own Ctrl/Cmd+C -- this only runs in response to the Clipboard Inspector's
 * "Capture Copy" button click (Technical Spec §29's "capture только после
 * явного действия пользователя"), never passively.
 *
 * Deliberately uses `document.execCommand('paste')` into a hidden
 * contenteditable, not the modern Async Clipboard API
 * (`navigator.clipboard.read()`). Chrome's Async API only exposes a
 * sanitized safelist (`text/plain`, `text/html`, `image/png`) and hides any
 * custom/proprietary MIME type a page wrote via `ClipboardEvent.setData()`
 * -- exactly the kind of rich internal format this research tool exists to
 * find (Technical Spec §71 Hypothesis A; confirmed present in practice --
 * Google Slides writes `application/x-vnd.google-docs-drawings-object+wrapped`
 * and friends). A synthesized `paste` event's `event.clipboardData` is the
 * one API that still exposes the full, unsanitized format list and lets us
 * read each format's actual payload via `getData()`. `execCommand('paste')`
 * only works here without a permission prompt because the manifest already
 * declares `clipboardRead` (Technical Spec §26).
 */
export interface CapturedTextFormat {
  mime: string;
  data: string;
  size: number;
}

export interface ClipboardCaptureResult {
  /** String-retrievable formats (`getData()` returned non-empty) -- covers every custom vnd.google format seen so far, not just text/plain|html. */
  formats: CapturedTextFormat[];
  /** File/blob-kind payloads (e.g. an `image/png` from copying an image) -- kept separate per Technical Spec §29's "binary payload сохранять отдельными файлами". */
  files: File[];
}

export type ClipboardCaptureOutcome =
  | { ok: true; result: ClipboardCaptureResult }
  | { ok: false; error: string };

export async function captureClipboardFormats(doc: Document = document): Promise<ClipboardCaptureOutcome> {
  return new Promise((resolve) => {
    const target = doc.createElement('div');
    target.contentEditable = 'true';
    Object.assign(target.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      opacity: '0',
      pointerEvents: 'none',
    } satisfies Partial<CSSStyleDeclaration>);
    doc.body.appendChild(target);

    let settled = false;
    const finish = (outcome: ClipboardCaptureOutcome) => {
      if (settled) return;
      settled = true;
      target.removeEventListener('paste', onPaste);
      target.remove();
      resolve(outcome);
    };

    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        finish({ ok: false, error: 'No clipboardData on paste event.' });
        return;
      }

      const formats: CapturedTextFormat[] = [];
      for (const mime of Array.from(clipboardData.types)) {
        if (mime === 'Files') continue;
        const data = clipboardData.getData(mime);
        if (!data) continue;
        formats.push({ mime, data, size: new Blob([data]).size });
      }
      const files = Array.from(clipboardData.files ?? []);

      finish({ ok: true, result: { formats, files } });
    };

    target.addEventListener('paste', onPaste);
    target.focus();

    const timeoutId = doc.defaultView?.setTimeout(() => {
      finish({ ok: false, error: 'Paste did not fire -- clipboard may be empty or access was blocked.' });
    }, 500);

    const succeeded = doc.execCommand('paste');
    if (!succeeded) {
      if (timeoutId !== undefined) doc.defaultView?.clearTimeout(timeoutId);
      finish({ ok: false, error: 'document.execCommand("paste") was blocked or unsupported in this context.' });
    }
  });
}
