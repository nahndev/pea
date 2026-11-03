import { Injectable } from '@nestjs/common';
import { AnalysisSchema, SubjectType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { createSubject } from '../../../subjects/subject';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

const SEQ_SCAN_RATES_SQL = `
  SELECT schemaname AS schema, relname AS name, (seq_scan + coalesce(idx_scan, 0))::float8 AS scans, n_live_tup::float8 AS "liveRows",
    (seq_scan * 100.0 / NULLIF(seq_scan + coalesce(idx_scan, 0), 0))::float8 AS percent
  FROM pg_stat_user_tables
  WHERE n_live_tup >= $2 AND seq_scan * 100.0 / NULLIF(seq_scan + coalesce(idx_scan, 0), 0) > $1
  ORDER BY seq_scan DESC
  LIMIT $3
`;

@Injectable()
export class SeqScanRateHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { maxPercent, minRows } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || typeof maxPercent !== 'number' || typeof minRows !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ schema: string; name: string; scans: number; liveRows: number; percent: number }>(SEQ_SCAN_RATES_SQL, [
        maxPercent,
        minRows,
        MAX_DATABASE_ISSUES,
      ]),
    );
    return rows.map(({ schema, name, scans, liveRows, percent }) => ({
      ruleId: rule.id,
      description: `Sequential scans ${percent.toFixed(1)}% of ${scans} scans on ${liveRows} rows exceeds ${maxPercent}%`,
      subject: createSubject(SubjectType.TABLE, `${schema}.${name}`),
    }));
  }
}
