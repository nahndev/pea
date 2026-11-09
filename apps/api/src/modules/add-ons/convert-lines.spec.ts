import { convertWith } from './add-ons.testing';

describe('convertLines', () => {
  it('writes one NDJSON line per converted line and counts skipped ones', async () => {
    const result = await convertWith((line) => (line === 'bad' ? null : { line }), 'a\r\n\nbad\n  \nb');

    expect(result).toEqual({ converted: 2, skipped: 1, content: '{"line":"a"}\n{"line":"b"}\n' });
  });

  it('skips a line the converter throws on', async () => {
    const result = await convertWith(() => {
      throw new Error('boom');
    }, 'a');

    expect(result).toEqual({ converted: 0, skipped: 1, content: '' });
  });
});
