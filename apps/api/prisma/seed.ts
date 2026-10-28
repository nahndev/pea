import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { MetricType, RuleType } from '@tomato/constants';
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
  } finally {
    await prismaClient.$disconnect();
  }
}

void main();
