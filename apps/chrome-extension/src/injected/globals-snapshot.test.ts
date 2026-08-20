import { describe, expect, it } from 'vitest';
import { buildGlobalsSnapshot } from './globals-snapshot';

describe('buildGlobalsSnapshot', () => {
  it('records only the typeof matching globals, never their value', () => {
    const fakeWindow = {
      _docs_flag_initialData: { huge: 'payload' },
      editorDeferred: () => undefined,
      SK_editorStatusApi: { D: 1 },
      unrelatedGlobal: 'should be ignored',
      alert: () => undefined,
    };

    expect(buildGlobalsSnapshot(fakeWindow)).toEqual({
      _docs_flag_initialData: 'object',
      editorDeferred: 'function',
      SK_editorStatusApi: 'object',
    });
  });

  it('returns an empty snapshot when nothing matches', () => {
    expect(buildGlobalsSnapshot({ foo: 1, bar: 2 })).toEqual({});
  });

  it('accepts a custom pattern', () => {
    expect(buildGlobalsSnapshot({ myThing: 1, other: 2 }, /^myThing$/)).toEqual({ myThing: 'number' });
  });
});
