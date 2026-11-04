import { describe, expect, it } from 'vitest';
import { MAX_LOG_FILE_SIZE } from './analyses.constants';
import { createAnalysisSchema } from './analyses.schemas';

const file = (content = '{"method":"GET","route":"/api/cart","ms":120}\n', name = 'a.jsonl') => new File([content], name);
const messages = (input: unknown) => {
  const result = createAnalysisSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};
const base = { branch: 'a', title: 'Release 1' };

describe('createAnalysisSchema', () => {
  it('accepts a branch with a file and trims the branch and the title', () => {
    const parsed = createAnalysisSchema.parse({ branch: '  feat/x ', title: ' Release 1 ', schema: 'API', api_metric: file() });

    expect(parsed.branch).toBe('feat/x');
    expect(parsed.title).toBe('Release 1');
  });

  it('requires a branch and a title', () => {
    const errors = messages({ branch: '   ', title: '', schema: 'API', api_metric: file() });
    expect(errors).toContain('branch:required');
    expect(errors).toContain('title:required');
    expect(messages({ branch: 'a', schema: 'API', api_metric: file() })).toContain('title:required');
  });

  it('requires a known schema', () => {
    expect(messages({ ...base, api_metric: file() })).toContain('schema:required');
    expect(messages({ ...base, schema: 'NOPE', api_metric: file() })).toContain('schema:required');
    expect(createAnalysisSchema.parse({ ...base, schema: 'QUERY', api_metric: file() }).schema).toBe('QUERY');
  });

  it('requires a file', () => {
    expect(messages({ ...base, schema: 'API' })).toContain('api_metric:file_required');
  });

  it('rejects empty and oversized files', () => {
    expect(messages({ ...base, schema: 'API', api_metric: file('') })).toContain('api_metric:empty');
    const big = file();
    Object.defineProperty(big, 'size', { value: MAX_LOG_FILE_SIZE + 1 });
    expect(messages({ ...base, schema: 'API', api_metric: big })).toContain('api_metric:too_large');
  });

  describe('bug', () => {
    it('accepts a bug log', () => {
      expect(createAnalysisSchema.parse({ ...base, schema: 'BUG', bug_log: file() })).toMatchObject({ schema: 'BUG' });
    });

    it('requires the bug log, not the API metric log', () => {
      expect(messages({ ...base, schema: 'BUG', api_metric: file() })).toContain('bug_log:file_required');
      expect(messages({ ...base, schema: 'BUG', bug_log: file('') })).toContain('bug_log:empty');
    });
  });

  describe('database', () => {
    it('accepts a database without a file', () => {
      expect(createAnalysisSchema.parse({ ...base, schema: 'DATABASE', databaseId: 'db-1' })).toMatchObject({ schema: 'DATABASE', databaseId: 'db-1' });
    });

    it('requires a database', () => {
      expect(messages({ ...base, schema: 'DATABASE' })).toContain('databaseId:required');
      expect(messages({ ...base, schema: 'DATABASE', databaseId: '' })).toContain('databaseId:required');
    });
  });
});
