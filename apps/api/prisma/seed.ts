import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { MetricConditionOperator, MetricType, RuleType } from '@tomato/constants';
import { PrismaClient } from '../src/generated/client';

const RULES = [
  { type: RuleType.P90_FAILURE, description: 'P90 failure', config: { thresholdMs: 1000 } },
  { type: RuleType.P95_FAILURE, description: 'P95 failure', config: { thresholdMs: 2000 } },
  { type: RuleType.P50_FAILURE, description: 'P50 failure', config: { thresholdMs: 500 } },
];

const METRICS = [
  { type: MetricType.P50, description: 'P50 duration' },
  { type: MetricType.P90, description: 'P90 duration' },
  { type: MetricType.P95, description: 'P95 duration' },
];

const QUALITY_GATE = {
  name: 'Default',
  description: 'Default response time limits',
  conditions: [
    { metricType: MetricType.P50, operator: MetricConditionOperator.GT, threshold: 500 },
    { metricType: MetricType.P90, operator: MetricConditionOperator.GT, threshold: 1000 },
    { metricType: MetricType.P95, operator: MetricConditionOperator.GT, threshold: 2000 },
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
      if (!existing) await prismaClient.metric.create({ data: metric });
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
