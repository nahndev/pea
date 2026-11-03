import { describe, expect, it } from 'vitest';
import { buildDatabaseSchema } from './databases.schemas';

const messages = (input: unknown, hasStoredUrl?: boolean) => {
  const result = buildDatabaseSchema(hasStoredUrl).safeParse(input);
  return result.success ? [] : result.error.issues.map(({ path, message }) => `${path.join('.')}:${message}`);
};
const fields = { name: 'Shop', connectionMode: 'FIELDS', host: 'db', database: 'shop', user: 'reader' };
const url = { name: 'Shop', connectionMode: 'URL' };

describe('buildDatabaseSchema', () => {
  it('requires a name', () => {
    expect(messages({ ...fields, name: '  ' })).toContain('name:required');
  });

  it('accepts connection fields and an empty port', () => {
    expect(buildDatabaseSchema().parse({ ...fields, port: '' })).toMatchObject({ host: 'db', port: undefined });
  });

  it('coerces and bounds the port', () => {
    expect(buildDatabaseSchema().parse({ ...fields, port: '6543' })).toMatchObject({ port: 6543 });
    expect(messages({ ...fields, port: '0' })).toContain('port:invalid_port');
    expect(messages({ ...fields, port: '70000' })).toContain('port:invalid_port');
  });

  it('requires host, database and user', () => {
    const errors = messages({ name: 'Shop', connectionMode: 'FIELDS' });
    expect(errors).toEqual(expect.arrayContaining(['host:required', 'database:required', 'user:required']));
  });

  it('accepts a postgres connection string only', () => {
    expect(buildDatabaseSchema().parse({ ...url, connectionString: ' postgresql://u:p@db/shop ' })).toMatchObject({
      connectionString: 'postgresql://u:p@db/shop',
    });
    expect(messages({ ...url, connectionString: 'mysql://u@db/shop' })).toContain('connectionString:invalid_connection_string');
    expect(messages(url)).toContain('connectionString:required');
  });

  it('keeps the stored connection string when left blank', () => {
    expect(buildDatabaseSchema(true).parse({ ...url, connectionString: ' ' })).toMatchObject({ connectionString: undefined });
    expect(messages({ ...url, connectionString: 'mysql://u@db/shop' }, true)).toContain('connectionString:invalid_connection_string');
  });
});
