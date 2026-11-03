import { summarizeMetrics } from './summarize-metrics';
import { SUMMARY_METRIC_TYPES } from './metrics.constants';

const result = (type: 'P50' | 'P90' | 'P95', value: number, statuses: ('PASSED' | 'FAILED')[] = []) => ({
  value,
  metric: { type },
  evaluations: statuses.map((status) => ({ status, aggregate: 'NONE', operator: 'GT', threshold: 1000 })),
});

describe('summarizeMetrics', () => {
  it('returns nothing without results', () => {
    expect(summarizeMetrics(SUMMARY_METRIC_TYPES, [])).toEqual([]);
  });

  it('orders by metric type and keeps the worst value', () => {
    const summaries = summarizeMetrics(SUMMARY_METRIC_TYPES, [result('P95', 900), result('P50', 100), result('P50', 300)]);

    expect(summaries.map(({ type }) => type)).toEqual(['P50', 'P95']);
    expect(summaries[0]).toMatchObject({ worstValue: 300, gateStatus: null, limit: null });
  });

  it('fails the gate when any evaluation fails', () => {
    const [summary] = summarizeMetrics(SUMMARY_METRIC_TYPES, [result('P90', 500, ['PASSED']), result('P90', 1500, ['FAILED'])]);

    expect(summary.gateStatus).toBe('FAILED');
    expect(summary.limit).toEqual({ operator: 'GT', threshold: 1000 });
  });

  it('passes the gate when every evaluation passes', () => {
    expect(summarizeMetrics(SUMMARY_METRIC_TYPES, [result('P90', 500, ['PASSED'])])[0].gateStatus).toBe('PASSED');
  });
});
