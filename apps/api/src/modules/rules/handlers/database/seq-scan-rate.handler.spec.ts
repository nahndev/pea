import { RuleType, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import { DATABASE_CONTEXT, mockDatabaseConnections } from '../../../database-connections/database-connections.fixtures';
import { createSubject } from '../../../subjects/subject';
import { SeqScanRateHandler } from './seq-scan-rate.handler';

describe('SeqScanRateHandler', () => {
  const rule = { id: 'r-1', type: RuleType.SEQ_SCAN_RATE, config: { maxPercent: 90, minRows: 10000 } as object } as Rule;

  it('reports each large table read mostly by sequential scans', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ schema: 'sales', name: 'events', scans: 3402, liveRows: 1200000, percent: 97.14 }] });

    await expect(new SeqScanRateHandler(mockDatabaseConnections(query)).handle(rule, DATABASE_CONTEXT)).resolves.toEqual([
      {
        ruleId: 'r-1',
        description: 'Sequential scans 97.1% of 3402 scans on 1200000 rows exceeds 90%',
        subject: createSubject(SubjectType.TABLE, 'sales.events'),
      },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('seq_scan'), [90, 10000, 100]);
  });
});
