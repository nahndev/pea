import type { Client } from 'pg';
import { createQuerySubject, hasPgStatStatements } from './postgres-stats';

describe('hasPgStatStatements', () => {
  const client = (query: jest.Mock) => ({ query }) as unknown as Client;

  it('is true when the extension is installed and readable', async () => {
    const query = jest.fn().mockResolvedValueOnce({ rows: [{ isInstalled: true }] }).mockResolvedValueOnce({ rows: [] });

    await expect(hasPgStatStatements(client(query))).resolves.toBe(true);
  });

  it('is false when the extension is not installed', async () => {
    const query = jest.fn().mockResolvedValueOnce({ rows: [{ isInstalled: false }] });

    await expect(hasPgStatStatements(client(query))).resolves.toBe(false);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('is false when the extension is not preloaded, but rethrows other errors', async () => {
    const notPreloaded = Object.assign(new Error('must be loaded via shared_preload_libraries'), { code: '55000' });
    const installed = { rows: [{ isInstalled: true }] };

    await expect(hasPgStatStatements(client(jest.fn().mockResolvedValueOnce(installed).mockRejectedValueOnce(notPreloaded)))).resolves.toBe(false);
    await expect(hasPgStatStatements(client(jest.fn().mockResolvedValueOnce(installed).mockRejectedValueOnce(new Error('boom'))))).rejects.toThrow('boom');
  });
});

describe('createQuerySubject', () => {
  it('collapses whitespace so the same query keeps the same subject', () => {
    expect(createQuerySubject('SELECT *\n  FROM orders  ')).toEqual(createQuerySubject('SELECT * FROM orders'));
    expect(createQuerySubject('SELECT *\n  FROM orders').description).toBe('SELECT * FROM orders');
  });
});
