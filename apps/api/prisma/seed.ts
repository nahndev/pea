import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { MetricConditionOperator, MetricType, MetricUnit, RuleType, Severity } from '@tomato/constants';
import { PrismaClient } from '../src/generated/client';

const RULES = [
  { type: RuleType.P90_FAILURE, description: 'P90 failure', severity: Severity.HIGH, config: { thresholdMs: 1000 } },
  { type: RuleType.P95_FAILURE, description: 'P95 failure', severity: Severity.HIGH, config: { thresholdMs: 2000 } },
  { type: RuleType.P50_FAILURE, description: 'P50 failure', severity: Severity.MEDIUM, config: { thresholdMs: 500 } },
  { type: RuleType.P99_FAILURE, description: 'P99 failure', severity: Severity.HIGH, config: { thresholdMs: 3000 } },
  { type: RuleType.AVG_LATENCY, description: 'Average latency', severity: Severity.MEDIUM, config: { thresholdMs: 400 } },
  { type: RuleType.MAX_LATENCY, description: 'Max latency', severity: Severity.LOW, config: { thresholdMs: 3000 } },
  { type: RuleType.SLOW_REQUEST_RATE, description: 'Slow request rate', severity: Severity.MEDIUM, config: { thresholdMs: 1000, maxPercent: 5 } },
  { type: RuleType.ERROR_RATE, description: '5xx error rate', severity: Severity.BLOCKER, config: { maxPercent: 1 } },
  { type: RuleType.CLIENT_ERROR_RATE, description: '4xx error rate', severity: Severity.LOW, config: { maxPercent: 5 } },
  { type: RuleType.SLOW_ROUTE, description: 'Slow route', severity: Severity.MEDIUM, config: { thresholdMs: 1500, minRequests: 10 } },
  { type: RuleType.SLOW_API, description: 'Slow API', severity: Severity.LOW, config: { thresholdMs: 2000 } },
  { type: RuleType.ROUTE_ERROR_RATE, description: 'Route 5xx error rate', severity: Severity.HIGH, config: { maxPercent: 5, minRequests: 10 } },
];

const METRICS = [
  { type: MetricType.P50, unit: MetricUnit.MILLISECOND, description: 'P50 duration' },
  { type: MetricType.P90, unit: MetricUnit.MILLISECOND, description: 'P90 duration' },
  { type: MetricType.P95, unit: MetricUnit.MILLISECOND, description: 'P95 duration' },
  { type: MetricType.ENDPOINT_P95, unit: MetricUnit.MILLISECOND, description: 'P95 duration per endpoint' },
  { type: MetricType.BLOCKER_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Blocker issues' },
  { type: MetricType.HIGH_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'High issues' },
  { type: MetricType.MEDIUM_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Medium issues' },
  { type: MetricType.LOW_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Low issues' },
  { type: MetricType.INFO_ISSUE_COUNT, unit: MetricUnit.COUNT, description: 'Info issues' },
];

const QUALITY_GATE = {
  name: 'Default',
  description: 'Default response time and issue limits',
  conditions: [
    { metricType: MetricType.P50, operator: MetricConditionOperator.GT, threshold: 500 },
    { metricType: MetricType.P90, operator: MetricConditionOperator.GT, threshold: 1000 },
    { metricType: MetricType.P95, operator: MetricConditionOperator.GT, threshold: 2000 },
    { metricType: MetricType.ENDPOINT_P95, operator: MetricConditionOperator.GT, threshold: 3000 },
    { metricType: MetricType.BLOCKER_ISSUE_COUNT, operator: MetricConditionOperator.GT, threshold: 0 },
    { metricType: MetricType.HIGH_ISSUE_COUNT, operator: MetricConditionOperator.GT, threshold: 0 },
  ],
};

async function main() {
  const prismaClient = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    for (const rule of RULES) {
      const { type, description, config } = rule;
      const existing = await prismaClient.rule.findFirst({ where: { type, description }, select: { id: true } });
      if (existing) await prismaClient.rule.update({ where: { id: existing.id }, data: { config } });
      else await prismaClient.rule.create({ data: rule });
    }

    for (const metric of METRICS) {
      const existing = await prismaClient.metric.findFirst({ where: { type: metric.type }, select: { id: true } });
      if (existing) await prismaClient.metric.update({ where: { id: existing.id }, data: { unit: metric.unit } });
      else await prismaClient.metric.create({ data: metric });
    }

    const { name, description, conditions } = QUALITY_GATE;
    const qualityGate = await prismaClient.qualityGate.upsert({
      where: { name },
      create: { name, description },
      update: { description },
    });
    for (const { metricType, operator, threshold } of conditions) {
      const metric = await prismaClient.metric.findFirstOrThrow({ where: { type: metricType }, select: { id: true } });
      const existing = await prismaClient.metricCondition.findFirst({
        where: { qualityGateId: qualityGate.id, metricId: metric.id },
        select: { id: true },
      });
      if (existing) await prismaClient.metricCondition.update({ where: { id: existing.id }, data: { operator, threshold } });
      else await prismaClient.metricCondition.create({ data: { qualityGateId: qualityGate.id, metricId: metric.id, operator, threshold } });
    }
  } finally {
    await prismaClient.$disconnect();
  }
}

void main();
