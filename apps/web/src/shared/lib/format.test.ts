import { describe, expect, it } from 'vitest';
import { formatDuration } from './format';

describe('formatDuration', () => {
  it('uses milliseconds below one second', () => {
    expect(formatDuration(412.34)).toBe('412.3 ms');
  });

  it('switches to seconds from one second', () => {
    expect(formatDuration(1500)).toBe('1.5 s');
  });
});
