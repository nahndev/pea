import { describe, expect, it } from 'vitest';
import { MAX_LOG_FILE_SIZE } from './analyses.constants';
import { createAnalysisSchema } from './analyses.schemas';

const file = (content = '{"resourceMetrics":[]}\n', name = 'a.jsonl') => new File([content], name);
const messages = (input: unknown) => {
  const result = createAnalysisSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};

describe('createAnalysisSchema', () => {
  it('accepts a branch with one file and trims the branch', () => {
    const parsed = createAnalysisSchema.parse({ branch: '  feat/x ', mergeRequestIid: '', api_metric: file() });

    expect(parsed.branch).toBe('feat/x');
    expect(parsed.mergeRequestIid).toBeUndefined();
  });

  it('coerces the merge request number', () => {
    expect(createAnalysisSchema.parse({ branch: 'a', mergeRequestIid: '12', query: file() }).mergeRequestIid).toBe(12);
  });

  it('requires a branch', () => {
    expect(messages({ branch: '   ', api_metric: file() })).toContain('branch:required');
  });

  it('rejects invalid merge request numbers', () => {
    expect(messages({ branch: 'a', mergeRequestIid: '0', api_metric: file() })).toContain('mergeRequestIid:invalid');
    expect(messages({ branch: 'a', mergeRequestIid: '1.5', api_metric: file() })).toContain('mergeRequestIid:invalid');
  });

  it('requires at least one file', () => {
    expect(messages({ branch: 'a' })).toContain('api_metric:file_required');
  });

  it('rejects empty and oversized files', () => {
    expect(messages({ branch: 'a', api_metric: file('') })).toContain('api_metric:empty');
    const big = file();
    Object.defineProperty(big, 'size', { value: MAX_LOG_FILE_SIZE + 1 });
    expect(messages({ branch: 'a', query: big })).toContain('query:too_large');
  });
});
