import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().min(1),
  UPLOAD_DIR: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment variables\n${issues.join('\n')}`);
  }
  return result.data;
}
