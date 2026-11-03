import { SubjectType } from '@tomato/constants';
import type { Client } from 'pg';
import type { Metric } from '../../../../generated/client';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { API_CONTEXT, DATABASE_CONTEXT } from '../../../database-connections/database-connections.fixtures';
import { createSubject } from '../../../subjects/subject';
import { TableRowsHandler } from './table-rows.handler';

describe('TableRowsHandler', () => {
  const metric = { id: 'm-1', type: 'TABLE_ROWS' } as Metric;
  let query: jest.Mock;
  let databaseConnectionsService: jest.Mocked<Pick<DatabaseConnectionsService, 'withClient'>>;
  let tableRowsHandler: TableRowsHandler;

  beforeEach(() => {
    query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ schema: 'public', name: 'orders' }, { schema: 'sales', name: 'Weird"Name' }] })
      .mockResolvedValueOnce({ rows: [{ count: '42' }] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });
    databaseConnectionsService = {
      withClient: jest.fn((_connection, use) => use({ query } as unknown as Client)) as never,
    };
    tableRowsHandler = new TableRowsHandler(databaseConnectionsService as unknown as DatabaseConnectionsService);
  });

  it('counts the rows of every readable table, one subject per table', async () => {
    const measurements = await tableRowsHandler.handle(metric, DATABASE_CONTEXT);

    expect(databaseConnectionsService.withClient).toHaveBeenCalledWith(DATABASE_CONTEXT.connection, expect.any(Function));
    expect(query).toHaveBeenNthCalledWith(2, 'SELECT count(*) AS count FROM "public"."orders"');
    expect(query).toHaveBeenNthCalledWith(3, 'SELECT count(*) AS count FROM "sales"."Weird""Name"');
    expect(measurements).toEqual([
      { subject: createSubject(SubjectType.TABLE, 'public.orders'), value: 42 },
      { subject: createSubject(SubjectType.TABLE, 'sales.Weird"Name'), value: 0 },
    ]);
  });

  it('measures nothing for another schema', async () => {
    await expect(tableRowsHandler.handle(metric, API_CONTEXT)).resolves.toEqual([]);
    expect(databaseConnectionsService.withClient).not.toHaveBeenCalled();
  });
});
