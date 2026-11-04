import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { AnalysisSchema, MetricConditionOperator, MetricType, MetricUnit, RuleType, Severity } from '@tomato/constants';
import { PrismaClient } from '../src/generated/client';
import { DEFAULT_SUBJECT } from '../src/modules/subjects/subject';

const RULES = [
  { schema: AnalysisSchema.API, type: RuleType.P90_FAILURE, description: 'P90 failure', severity: Severity.HIGH, config: { thresholdMs: 1000 } },
  { schema: AnalysisSchema.API, type: RuleType.P95_FAILURE, description: 'P95 failure', severity: Severity.HIGH, config: { thresholdMs: 2000 } },
  { schema: AnalysisSchema.API, type: RuleType.P50_FAILURE, description: 'P50 failure', severity: Severity.MEDIUM, config: { thresholdMs: 500 } },
  { schema: AnalysisSchema.API, type: RuleType.P99_FAILURE, description: 'P99 failure', severity: Severity.HIGH, config: { thresholdMs: 3000 } },
  { schema: AnalysisSchema.API, type: RuleType.AVG_LATENCY, description: 'Average latency', severity: Severity.MEDIUM, config: { thresholdMs: 400 } },
  { schema: AnalysisSchema.API, type: RuleType.MAX_LATENCY, description: 'Max latency', severity: Severity.LOW, config: { thresholdMs: 3000 } },
  { schema: AnalysisSchema.API, type: RuleType.SLOW_REQUEST_RATE, description: 'Slow request rate', severity: Severity.MEDIUM, config: { thresholdMs: 1000, maxPercent: 5 } },
  { schema: AnalysisSchema.API, type: RuleType.ERROR_RATE, description: '5xx error rate', severity: Severity.BLOCKER, config: { maxPercent: 1 } },
  { schema: AnalysisSchema.API, type: RuleType.CLIENT_ERROR_RATE, description: '4xx error rate', severity: Severity.LOW, config: { maxPercent: 5 } },
  { schema: AnalysisSchema.API, type: RuleType.SLOW_ROUTE, description: 'Slow route', severity: Severity.MEDIUM, config: { thresholdMs: 1500, minRequests: 10 } },
  { schema: AnalysisSchema.API, type: RuleType.SLOW_API, description: 'Slow API', severity: Severity.LOW, config: { thresholdMs: 2000 } },
  { schema: AnalysisSchema.API, type: RuleType.ROUTE_ERROR_RATE, description: 'Route 5xx error rate', severity: Severity.HIGH, config: { maxPercent: 5, minRequests: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.SLOW_QUERY, description: 'Slow query', severity: Severity.HIGH, config: { thresholdMs: 500, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.LONG_RUNNING_QUERY, description: 'Long-running query', severity: Severity.MEDIUM, config: { thresholdMs: 60000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.LOCK_WAIT, description: 'Lock wait', severity: Severity.HIGH, config: { thresholdMs: 5000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.DEAD_TUPLE_RATE, description: 'Dead tuple rate', severity: Severity.MEDIUM, config: { maxPercent: 20, minRows: 1000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.SEQ_SCAN_RATE, description: 'Sequential scan rate', severity: Severity.MEDIUM, config: { maxPercent: 90, minRows: 10000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.UNUSED_INDEX, description: 'Unused index', severity: Severity.LOW, config: { minRows: 1000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.LOW_CACHE_HIT_RATIO, description: 'Low cache hit ratio', severity: Severity.MEDIUM, config: { minPercent: 99 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.HIGH_TOTAL_TIME_QUERY, description: 'High total time query', severity: Severity.MEDIUM, config: { thresholdMs: 600000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.MAX_TIME_SPIKE_QUERY, description: 'Max time spike query', severity: Severity.LOW, config: { thresholdMs: 1000, maxRatio: 10, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.UNSTABLE_QUERY, description: 'Unstable query', severity: Severity.LOW, config: { maxRatio: 2, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.FREQUENT_QUERY, description: 'Frequent query', severity: Severity.INFO, config: { minCalls: 1000000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.N_PLUS_ONE_QUERY, description: 'Suspected N+1 query', severity: Severity.MEDIUM, config: { minCalls: 10000, maxRows: 1 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.LARGE_RESULT_QUERY, description: 'Large result query', severity: Severity.MEDIUM, config: { maxRows: 10000, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.UNLIMITED_SELECT_QUERY, description: 'SELECT without LIMIT', severity: Severity.LOW, config: { maxRows: 1000, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.SELECT_STAR_QUERY, description: 'SELECT * query', severity: Severity.INFO, config: { minCalls: 100 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.MISSING_INDEX_QUERY, description: 'Suspected missing index', severity: Severity.HIGH, config: { maxRatio: 100, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.DISK_READ_QUERY, description: 'Heavy disk read query', severity: Severity.MEDIUM, config: { maxBlocks: 1000, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.LOW_CACHE_HIT_QUERY, description: 'Query low cache hit ratio', severity: Severity.MEDIUM, config: { minPercent: 95, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.DIRTIED_BUFFERS_QUERY, description: 'Query dirtying many buffers', severity: Severity.LOW, config: { maxBlocks: 1000, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.WRITTEN_BUFFERS_QUERY, description: 'Query writing buffers directly', severity: Severity.MEDIUM, config: { maxBlocks: 100, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.TEMP_FILE_QUERY, description: 'Query using temp files', severity: Severity.MEDIUM, config: { maxBlocks: 0, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.LOCAL_BUFFER_QUERY, description: 'Heavy temp table usage', severity: Severity.LOW, config: { maxBlocks: 10000, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.HIGH_WAL_QUERY, description: 'Large WAL volume query', severity: Severity.LOW, config: { maxBytes: 10485760, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.HIGH_IO_TIME_QUERY, description: 'High I/O time query', severity: Severity.MEDIUM, config: { thresholdMs: 100, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.SLOW_PLANNING_QUERY, description: 'Slow planning query', severity: Severity.MEDIUM, config: { thresholdMs: 100, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.PLAN_OVER_EXEC_QUERY, description: 'Planning exceeds execution', severity: Severity.LOW, config: { minCalls: 100 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.HIGH_JIT_QUERY, description: 'High JIT overhead', severity: Severity.MEDIUM, config: { maxPercent: 50, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.OFFSET_PAGINATION_QUERY, description: 'OFFSET pagination', severity: Severity.LOW, config: { minCalls: 100 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.LIKE_QUERY, description: 'LIKE / ILIKE query', severity: Severity.INFO, config: { minCalls: 100 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.FUNCTION_IN_WHERE_QUERY, description: 'Function on column in WHERE', severity: Severity.LOW, config: { minCalls: 100 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.ORDER_BY_RANDOM_QUERY, description: 'ORDER BY random()', severity: Severity.MEDIUM, config: { minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.LONG_IN_LIST_QUERY, description: 'Long IN list', severity: Severity.LOW, config: { maxItems: 100, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.FREQUENT_COUNT_QUERY, description: 'Frequent COUNT(*)', severity: Severity.LOW, config: { minCalls: 10000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.UNFILTERED_WRITE_QUERY, description: 'UPDATE / DELETE without WHERE', severity: Severity.HIGH, config: { minCalls: 1 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.MASS_WRITE_QUERY, description: 'Mass UPDATE / DELETE', severity: Severity.MEDIUM, config: { maxRows: 10000, minCalls: 1 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.ROW_BY_ROW_INSERT_QUERY, description: 'Row-by-row INSERT', severity: Severity.LOW, config: { minCalls: 10000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.CPU_INTENSIVE_QUERY, description: 'CPU-intensive query', severity: Severity.MEDIUM, config: { thresholdMs: 500, maxPercent: 10, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.IO_INTENSIVE_QUERY, description: 'I/O-intensive query', severity: Severity.MEDIUM, config: { maxPercent: 20 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.DATABASE_WORKLOAD, description: 'Database workload share', severity: Severity.INFO, config: { maxPercent: 80 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.ROLE_WORKLOAD, description: 'Role workload share', severity: Severity.INFO, config: { maxPercent: 80 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.CHANGED_QUERY, description: 'New or changed query', severity: Severity.INFO, config: { minCalls: 100, maxRatio: 3 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.REGRESSED_QUERY, description: 'Query regression', severity: Severity.HIGH, config: { maxRatio: 2, minCalls: 100 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.EXPENSIVE_UTILITY_COMMAND, description: 'Expensive utility command', severity: Severity.LOW, config: { thresholdMs: 60000 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.NESTED_QUERY, description: 'Slow query inside function', severity: Severity.LOW, config: { thresholdMs: 100, minCalls: 10 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.STATEMENT_EVICTION, description: 'pg_stat_statements evictions', severity: Severity.MEDIUM, config: { maxPercent: 90 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.QUERY_VARIANTS, description: 'Too many query ids', severity: Severity.LOW, config: { maxItems: 20 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.TIME_SHARE_QUERY, description: 'Execution time share', severity: Severity.MEDIUM, config: { maxPercent: 20 } },
  { schema: AnalysisSchema.DATABASE, type: RuleType.READ_WRITE_RATIO, description: 'Write-heavy workload', severity: Severity.INFO, config: { maxPercent: 50 } },
  { schema: AnalysisSchema.BUG, type: RuleType.CRITICAL_ERROR, description: 'Critical error', severity: Severity.HIGH, config: { minCount: 1 } },
  { schema: AnalysisSchema.BUG, type: RuleType.FREQUENT_ERROR, description: 'Frequent error', severity: Severity.MEDIUM, config: { minCount: 100 } },
  { schema: AnalysisSchema.BUG, type: RuleType.ERROR_ENDPOINT, description: 'Endpoint raising errors', severity: Severity.LOW, config: { minCount: 20 } },
];

const METRICS = [
  { schema: AnalysisSchema.API, type: MetricType.P50, unit: MetricUnit.MILLISECOND, description: 'P50 duration' },
  { schema: AnalysisSchema.API, type: MetricType.P90, unit: MetricUnit.MILLISECOND, description: 'P90 duration' },
  { schema: AnalysisSchema.API, type: MetricType.P95, unit: MetricUnit.MILLISECOND, description: 'P95 duration' },
  { schema: AnalysisSchema.API, type: MetricType.ENDPOINT_P95, unit: MetricUnit.MILLISECOND, description: 'P95 duration per endpoint' },
  { schema: AnalysisSchema.API, type: MetricType.BLOCKER_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Blocker issues' },
  { schema: AnalysisSchema.API, type: MetricType.HIGH_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'High issues' },
  { schema: AnalysisSchema.API, type: MetricType.MEDIUM_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Medium issues' },
  { schema: AnalysisSchema.API, type: MetricType.LOW_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Low issues' },
  { schema: AnalysisSchema.API, type: MetricType.INFO_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Info issues' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.TABLE_ROWS, unit: MetricUnit.COUNT, description: 'Rows per table' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.TABLE_DEAD_TUPLES, unit: MetricUnit.COUNT, description: 'Dead tuples per table' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.QUERY_MEAN_DURATION, unit: MetricUnit.MILLISECOND, description: 'Mean duration per query' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.CACHE_HIT_RATIO, unit: MetricUnit.PERCENT, description: 'Cache hit ratio' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.CONNECTIONS, unit: MetricUnit.COUNT, description: 'Connections' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.WAITING_LOCKS, unit: MetricUnit.COUNT, description: 'Waiting locks' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.DEADLOCKS, unit: MetricUnit.COUNT, description: 'Deadlocks since statistics reset' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.TEMP_FILES, unit: MetricUnit.COUNT, description: 'Temp files since statistics reset' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.REPLICATION_LAG, unit: MetricUnit.MILLISECOND, description: 'Max replica replay lag' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.BLOCKER_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Blocker issues' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.HIGH_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'High issues' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.MEDIUM_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Medium issues' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.LOW_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Low issues' },
  { schema: AnalysisSchema.DATABASE, type: MetricType.INFO_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Info issues' },
  { schema: AnalysisSchema.BUG, type: MetricType.ERROR_COUNT, unit: MetricUnit.COUNT, description: 'Errors' },
  { schema: AnalysisSchema.BUG, type: MetricType.CRITICAL_ERROR_COUNT, unit: MetricUnit.COUNT, description: 'Critical errors' },
  { schema: AnalysisSchema.BUG, type: MetricType.ERROR_GROUP_COUNT, unit: MetricUnit.COUNT, description: 'Distinct errors' },
  { schema: AnalysisSchema.BUG, type: MetricType.ERROR_OCCURRENCES, unit: MetricUnit.COUNT, description: 'Occurrences per error' },
  { schema: AnalysisSchema.BUG, type: MetricType.BLOCKER_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Blocker issues' },
  { schema: AnalysisSchema.BUG, type: MetricType.HIGH_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'High issues' },
  { schema: AnalysisSchema.BUG, type: MetricType.MEDIUM_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Medium issues' },
  { schema: AnalysisSchema.BUG, type: MetricType.LOW_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Low issues' },
  { schema: AnalysisSchema.BUG, type: MetricType.INFO_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Info issues' },
];

const CONDITIONS = [
  { schema: AnalysisSchema.API, metricType: MetricType.P50, operator: MetricConditionOperator.GT, threshold: 500 },
  { schema: AnalysisSchema.API, metricType: MetricType.P90, operator: MetricConditionOperator.GT, threshold: 1000 },
  { schema: AnalysisSchema.API, metricType: MetricType.P95, operator: MetricConditionOperator.GT, threshold: 2000 },
  { schema: AnalysisSchema.API, metricType: MetricType.ENDPOINT_P95, operator: MetricConditionOperator.GT, threshold: 3000 },
  { schema: AnalysisSchema.API, metricType: MetricType.BLOCKER_ISSUE_COUNT, operator: MetricConditionOperator.GT, threshold: 0 },
  { schema: AnalysisSchema.API, metricType: MetricType.HIGH_ISSUE_COUNT, operator: MetricConditionOperator.GT, threshold: 0 },
  { schema: AnalysisSchema.DATABASE, metricType: MetricType.BLOCKER_ISSUE_COUNT, operator: MetricConditionOperator.GT, threshold: 0 },
  { schema: AnalysisSchema.DATABASE, metricType: MetricType.HIGH_ISSUE_COUNT, operator: MetricConditionOperator.GT, threshold: 0 },
  { schema: AnalysisSchema.BUG, metricType: MetricType.CRITICAL_ERROR_COUNT, operator: MetricConditionOperator.GT, threshold: 0 },
  { schema: AnalysisSchema.BUG, metricType: MetricType.BLOCKER_ISSUE_COUNT, operator: MetricConditionOperator.GT, threshold: 0 },
];

async function main() {
  const prismaClient = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    await prismaClient.subject.upsert({ where: { uuid: DEFAULT_SUBJECT.uuid }, create: DEFAULT_SUBJECT, update: {} });

    for (const rule of RULES) {
      const { schema, type, description, config } = rule;
      const existing = await prismaClient.rule.findFirst({ where: { schema, type, description }, select: { id: true } });
      if (existing) await prismaClient.rule.update({ where: { id: existing.id }, data: { config } });
      else await prismaClient.rule.create({ data: rule });
    }

    for (const metric of METRICS) {
      const existing = await prismaClient.metric.findFirst({ where: { schema: metric.schema, type: metric.type }, select: { id: true } });
      if (existing) await prismaClient.metric.update({ where: { id: existing.id }, data: { unit: metric.unit } });
      else await prismaClient.metric.create({ data: metric });
    }

    for (const { schema, metricType, operator, threshold } of CONDITIONS) {
      const metric = await prismaClient.metric.findFirstOrThrow({ where: { schema, type: metricType }, select: { id: true } });
      const existing = await prismaClient.metricCondition.findFirst({ where: { metricId: metric.id }, select: { id: true } });
      if (existing) await prismaClient.metricCondition.update({ where: { id: existing.id }, data: { operator, threshold } });
      else await prismaClient.metricCondition.create({ data: { metricId: metric.id, operator, threshold } });
    }
  } finally {
    await prismaClient.$disconnect();
  }
}

void main();
