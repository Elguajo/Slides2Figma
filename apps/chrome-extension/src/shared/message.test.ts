import { describe, expect, it } from 'vitest';
import { parseMainWorldMessage } from './message';

describe('parseMainWorldMessage', () => {
  it('accepts a well-formed envelope', () => {
    const message = parseMainWorldMessage({
      channel: 'slides2figma',
      version: 1,
      type: 'PING',
      payload: { hello: 'world' },
    });
    expect(message).toEqual({
      channel: 'slides2figma',
      version: 1,
      type: 'PING',
      payload: { hello: 'world' },
    });
  });

  it('accepts a missing/undefined payload', () => {
    const message = parseMainWorldMessage({ channel: 'slides2figma', version: 1, type: 'PING' });
    expect(message?.type).toBe('PING');
  });

  it('rejects a wrong channel', () => {
    expect(
      parseMainWorldMessage({ channel: 'not-us', version: 1, type: 'PING', payload: null }),
    ).toBeNull();
  });

  it('rejects a wrong version', () => {
    expect(
      parseMainWorldMessage({ channel: 'slides2figma', version: 2, type: 'PING', payload: null }),
    ).toBeNull();
  });

  it('rejects a missing type', () => {
    expect(parseMainWorldMessage({ channel: 'slides2figma', version: 1, payload: null })).toBeNull();
  });

  it('rejects arbitrary unrelated page traffic', () => {
    expect(parseMainWorldMessage({ some: 'unrelated postMessage payload' })).toBeNull();
    expect(parseMainWorldMessage('a plain string')).toBeNull();
    expect(parseMainWorldMessage(null)).toBeNull();
    expect(parseMainWorldMessage(undefined)).toBeNull();
  });
});
