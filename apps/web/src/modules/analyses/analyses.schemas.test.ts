import { describe, expect, it } from 'vitest';
import { MAX_LOG_FILE_SIZE } from './analyses.constants';
import { createAnalysisSchema } from './analyses.schemas';

const file = (content = '{"method":"GET","route":"/api/cart","ms":120}\n', name = 'a.jsonl') => new File([content], name);
const messages = (input: unknown) => {
  const result = createAnalysisSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};
const base = { branch: 'a', title: 'Release 1' };
const database = { ...base, schema: 'DATABASE', connectionMode: 'FIELDS', host: 'db', database: 'shop', user: 'reader' };

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

  describe('database', () => {
    it('accepts connection fields without a file and an empty port', () => {
      const parsed = createAnalysisSchema.parse({ ...database, port: '' });

      expect(parsed).toMatchObject({ schema: 'DATABASE', host: 'db', port: undefined });
    });

    it('coerces and bounds the port', () => {
      expect(createAnalysisSchema.parse({ ...database, port: '6543' })).toMatchObject({ port: 6543 });
      expect(messages({ ...database, port: '0' })).toContain('port:invalid_port');
      expect(messages({ ...database, port: '70000' })).toContain('port:invalid_port');
    });

    it('requires host, database and user', () => {
      const errors = messages({ ...base, schema: 'DATABASE', connectionMode: 'FIELDS' });
      expect(errors).toEqual(expect.arrayContaining(['host:required', 'database:required', 'user:required']));
    });

    it('accepts a postgres connection string only', () => {
      const url = { ...base, schema: 'DATABASE', connectionMode: 'URL' };
      expect(createAnalysisSchema.parse({ ...url, connectionString: ' postgresql://u:p@db/shop ' })).toMatchObject({
        connectionString: 'postgresql://u:p@db/shop',
      });
      expect(messages({ ...url, connectionString: 'mysql://u@db/shop' })).toContain('connectionString:invalid_connection_string');
      expect(messages(url)).toContain('connectionString:required');
    });
  });
});
