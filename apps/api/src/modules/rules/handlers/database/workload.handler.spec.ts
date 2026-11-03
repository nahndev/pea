import { RuleType, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { API_CONTEXT, DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createSubject } from '../../../subjects/subject';
import { WorkloadHandler } from './workload.handler';

describe('WorkloadHandler', () => {
  const rule = (type: string = RuleType.DATABASE_WORKLOAD, config: object = { maxPercent: 80 }) => ({ id: 'r-1', type, config }) as Rule;
  let query: jest.Mock;
  let workloadHandler: WorkloadHandler;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue({ rows: [{ name: 'shop', calls: 1200, value: 91.5 }] });
    workloadHandler = new WorkloadHandler(mockDatabaseConnections(query));
  });

  it.each([
    [RuleType.DATABASE_WORKLOAD, SubjectType.DATABASE, 'pg_database', 'the server'],
    [RuleType.ROLE_WORKLOAD, SubjectType.ROLE, 'pg_roles', 'the database'],
  ])('reports each %s above the share as its subject', async (type, subjectType, view, label) => {
    await expect(workloadHandler.handle(rule(type), DATABASE_CONTEXT)).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: `91.5% of the statement execution time of ${label} (1200 calls), above 80%`,
        subject: createSubject(subjectType, 'shop'),
      },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining(view), [80, 100]);
  });

  it.each([
    [rule(), { ...DATABASE_CONTEXT, isPgStatStatements: false }],
    [rule(RuleType.DATABASE_WORKLOAD, {}), DATABASE_CONTEXT],
    [rule(), API_CONTEXT],
  ])('does not connect without pg_stat_statements, its config or a database', async (invalidRule, context) => {
    await expect(workloadHandler.handle(invalidRule, context)).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
