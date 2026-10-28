import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // `prisma generate` (install/build) runs without a database url
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
