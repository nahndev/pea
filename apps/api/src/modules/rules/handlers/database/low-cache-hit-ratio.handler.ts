import { Injectable } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import { DatabaseConnectionsService } from '../../../database-connections/database-connections.service';
import { CACHE_HIT_RATIO_SQL } from '../../../database-connections/postgres-stats';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

@Injectable()
export class LowCacheHitRatioHandler implements RuleHandler {
  constructor(private readonly databaseConnectionsService: DatabaseConnectionsService) {}

  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { minPercent } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || typeof minPercent !== 'number') return [];

    const { rows } = await this.databaseConnectionsService.withClient(context.connection, (client) =>
      client.query<{ value: number | null }>(CACHE_HIT_RATIO_SQL),
    );
    const ratio = rows[0]?.value;
    if (ratio === null || ratio === undefined || ratio >= minPercent) return [];
    return [{ ruleId: rule.id, description: `Cache hit ratio ${ratio.toFixed(2)}% is below ${minPercent}%` }];
  }
}
