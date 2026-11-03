import { Injectable } from '@nestjs/common';
import { AnalysisSchema, RuleType } from '@tomato/constants';
import type { Rule } from '../../../../generated/client';
import type { AnalysisContext } from '../../../analyses/analyses.types';
import type { QueryStat } from '../../../database-connections/database-connections.types';
import { MAX_DATABASE_ISSUES } from '../../rules.constants';
import type { RuleConfig } from '../../rules.types';
import type { RuleHandler, RuleIssue } from '../rule-handler.types';

interface QueryWindow {
  /** Counters since the previous snapshot, all of them after a statistics reset */
  window: QueryStat;
  before?: QueryStat;
}

const totalExecMs = (stats: QueryStat[]) => stats.reduce((total, { execMs }) => total + execMs, 0);

function describeChange({ window, before }: QueryWindow, maxRatio: number, windowMs: number, beforeMs: number): string | null {
  if (!before) return `New since the previous snapshot: ${window.calls} calls, ${window.execMs.toFixed(0)}ms`;
  const beforeShare = beforeMs ? (before.execMs * 100) / beforeMs : 0;
  const windowShare = windowMs ? (window.execMs * 100) / windowMs : 0;
  if (!beforeShare || windowShare <= beforeShare * maxRatio) return null;
  return `Share of execution time rose from ${beforeShare.toFixed(2)}% to ${windowShare.toFixed(1)}% since the previous snapshot`;
}

function describeRegression({ window, before }: QueryWindow, maxRatio: number, minCalls: number): string | null {
  if (!before || before.calls < minCalls) return null;
  const baseline = before.execMs / before.calls;
  const mean = window.execMs / window.calls;
  if (!baseline || mean <= baseline * maxRatio) return null;
  return `Mean ${mean.toFixed(1)}ms over the last ${window.calls} calls is ${(mean / baseline).toFixed(1)}× the baseline ${baseline.toFixed(2)}ms`;
}

/** Compares the counters with those saved by the previous run on the same database. */
@Injectable()
export class QuerySnapshotHandler implements RuleHandler {
  async handle(rule: Rule, context: AnalysisContext): Promise<RuleIssue[]> {
    const { minCalls, maxRatio } = rule.config as RuleConfig;
    if (context.schema !== AnalysisSchema.DATABASE || !context.queryStats.previous) return [];
    if (typeof minCalls !== 'number' || typeof maxRatio !== 'number') return [];

    const { current, previous } = context.queryStats;
    const queries = current.map(({ subject, calls, execMs }) => {
      const before: QueryStat | undefined = previous.queries[subject.uuid];
      const isReset = !before || calls < before.calls;
      return { subject, before, window: isReset ? { calls, execMs } : { calls: calls - before.calls, execMs: execMs - before.execMs } };
    });
    const windowMs = totalExecMs(queries.map(({ window }) => window));
    const beforeMs = totalExecMs(Object.values(previous.queries));

    const issues: RuleIssue[] = [];
    for (const query of queries.filter(({ window }) => window.calls >= minCalls).sort((a, b) => b.window.execMs - a.window.execMs)) {
      const description =
        rule.type === RuleType.REGRESSED_QUERY
          ? describeRegression(query, maxRatio, minCalls)
          : describeChange(query, maxRatio, windowMs, beforeMs);
      if (description) issues.push({ ruleId: rule.id, description, subject: query.subject });
    }
    return issues.slice(0, MAX_DATABASE_ISSUES);
  }
}
