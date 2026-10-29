import { DuckDBInstance } from '@duckdb/node-api';

export async function queryRows(sql: string): Promise<Record<string, unknown>[]> {
  const instance = await DuckDBInstance.create(':memory:');
  const connection = await instance.connect();
  try {
    const reader = await connection.runAndReadAll(sql);
    return reader.getRowObjects();
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}
