import { describe, expect, it } from 'vitest';
import { formatDuration, formatFileSize } from './format';

describe('formatDuration', () => {
  it('uses milliseconds below one second', () => {
    expect(formatDuration(412.34)).toBe('412.3 ms');
  });

  it('switches to seconds from one second', () => {
    expect(formatDuration(1500)).toBe('1.5 s');
  });
});

describe('formatFileSize', () => {
  it('picks the largest fitting unit', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(50 * 1024 * 1024)).toBe('50 MB');
  });
});
