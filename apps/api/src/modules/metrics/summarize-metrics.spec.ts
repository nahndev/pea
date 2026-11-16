import { summarizeMetrics } from './summarize-metrics';

const result = (type: string, value: number, statuses: ('PASSED' | 'FAILED')[] = [], unit = 'MILLISECOND') => ({
  value,
  metric: { id: `m-${type}`, type, unit },
  evaluations: statuses.map((status) => ({ status, aggregate: 'NONE', operator: 'GT', threshold: 1000 })),
});

describe('summarizeMetrics', () => {
  it('returns nothing without results', () => {
    expect(summarizeMetrics([])).toEqual([]);
  });

  it('keeps the metric order and the worst value of each metric', () => {
    const summaries = summarizeMetrics([result('P50', 100), result('P50', 300), result('PAGE_LOAD_COUNT', 12, [], 'COUNT')]);

    expect(summaries.map(({ type, unit }) => [type, unit])).toEqual([
      ['P50', 'MILLISECOND'],
      ['PAGE_LOAD_COUNT', 'COUNT'],
    ]);
    expect(summaries[0]).toMatchObject({ worstValue: 300, gateStatus: null, limit: null });
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
