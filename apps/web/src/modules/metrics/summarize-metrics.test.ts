import { describe, expect, it } from 'vitest';
import type { MetricResultView } from '@tomato/types';
import { summarizeMetrics } from './summarize-metrics';

const result = (
  type: 'P50' | 'P90' | 'P95',
  value: number,
  statuses: ('PASSED' | 'FAILED')[] = [],
  file = 'a.jsonl',
  subject = '',
): MetricResultView => ({
  id: `${type}-${value}-${file}-${subject}`,
  value,
  subject,
  metric: { id: `m-${type}`, type, unit: 'MILLISECOND', description: type },
  context: { file },
  evaluations: statuses.map((status) => ({ status, operator: 'GT', threshold: 1000, qualityGate: 'Default' })),
});

describe('summarizeMetrics', () => {
  it('returns nothing without results', () => {
    expect(summarizeMetrics([])).toEqual([]);
  });

  it('orders by metric type and keeps the worst value over contexts', () => {
    const summaries = summarizeMetrics([result('P95', 900), result('P50', 100), result('P50', 300, [], 'b.jsonl')]);

    expect(summaries.map(({ type }) => type)).toEqual(['P50', 'P95']);
    expect(summaries[0]).toMatchObject({ worstValue: 300, contextCount: 2, gateStatus: null, limit: null });
  });

  it('counts a file once even when it has several results', () => {
    const [summary] = summarizeMetrics([result('P50', 100, [], 'a.jsonl', 'GET /a'), result('P50', 200, [], 'a.jsonl', 'GET /b')]);

    expect(summary.contextCount).toBe(1);
    expect(summary.worstValue).toBe(200);
  });

  it('fails the gate when any evaluation fails', () => {
    const [summary] = summarizeMetrics([result('P90', 500, ['PASSED']), result('P90', 1500, ['FAILED'])]);

    expect(summary.gateStatus).toBe('FAILED');
    expect(summary.limit).toEqual({ operator: 'GT', threshold: 1000 });
  });

  it('passes the gate when every evaluation passes', () => {
    expect(summarizeMetrics([result('P90', 500, ['PASSED'])])[0].gateStatus).toBe('PASSED');
  });
});
