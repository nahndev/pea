import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { RuleType } from '@tomato/constants';
import { PrismaClient } from '../src/generated/client';

const RULES = [
  { type: RuleType.API_METRIC, description: 'P90 failure' },
  { type: RuleType.API_METRIC, description: 'P95 failure' },
  { type: RuleType.API_METRIC, description: 'P50 failure' },
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    for (const rule of RULES) {
      const exists = await prisma.rule.findFirst({ where: rule, select: { id: true } });
      if (!exists) await prisma.rule.create({ data: rule });
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
