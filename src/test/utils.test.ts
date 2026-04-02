import { describe, expect, it } from 'vitest';
import { readBooleanFlag } from '../lib/utils';

describe('readBooleanFlag', () => {
  it('treats false-like strings and numbers as false', () => {
    expect(readBooleanFlag('false', true)).toBe(false);
    expect(readBooleanFlag('0', true)).toBe(false);
    expect(readBooleanFlag(0, true)).toBe(false);
    expect(readBooleanFlag('off', true)).toBe(false);
  });

  it('treats true-like strings and numbers as true', () => {
    expect(readBooleanFlag('true', false)).toBe(true);
    expect(readBooleanFlag('1', false)).toBe(true);
    expect(readBooleanFlag(1, false)).toBe(true);
    expect(readBooleanFlag('on', false)).toBe(true);
  });

  it('falls back when the value is missing or unknown', () => {
    expect(readBooleanFlag(undefined, true)).toBe(true);
    expect(readBooleanFlag(null, false)).toBe(false);
    expect(readBooleanFlag('unexpected', true)).toBe(true);
  });
});
