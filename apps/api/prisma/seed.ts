import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { RuleType } from '@tomato/constants';
import { PrismaClient } from '../src/generated/client';

const RULES = [
  { type: RuleType.P90_FAILURE, description: 'P90 failure', config: { thresholdMs: 1000 } },
  { type: RuleType.P95_FAILURE, description: 'P95 failure', config: { thresholdMs: 2000 } },
  { type: RuleType.P50_FAILURE, description: 'P50 failure', config: { thresholdMs: 500 } },
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    for (const rule of RULES) {
      const { type, description, config } = rule;
      const existing = await prisma.rule.findFirst({ where: { type, description }, select: { id: true } });
      if (existing) await prisma.rule.update({ where: { id: existing.id }, data: { config } });
      else await prisma.rule.create({ data: rule });
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
