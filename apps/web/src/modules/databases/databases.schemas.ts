import { DatabaseConnectionMode, DatabaseSortField } from '@tomato/constants';
import { z } from 'zod';
import { orderingParam } from '@/shared/lib/sort';
import { POSTGRES_URL_PATTERN } from './databases.constants';

const requiredText = (max = 255) => z.string('required').trim().min(1, 'required').max(max, 'too_long');

const connectionStringSchema = requiredText(2048).regex(POSTGRES_URL_PATTERN, 'invalid_connection_string');

const fieldsSchema = z.object({
  name: requiredText(),
  connectionMode: z.literal(DatabaseConnectionMode.FIELDS),
  host: requiredText(),
  port: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.coerce.number('invalid_port').int('invalid_port').min(1, 'invalid_port').max(65535, 'invalid_port').optional(),
  ),
  database: requiredText(),
  user: requiredText(),
  password: z.string().max(255, 'too_long').optional(),
});

/** With `hasStoredUrl`, an empty connection string keeps the stored one. */
export const buildDatabaseSchema = (hasStoredUrl = false) =>
  z.discriminatedUnion(
    'connectionMode',
    [
      fieldsSchema,
      z.object({
        name: requiredText(),
        connectionMode: z.literal(DatabaseConnectionMode.URL),
        connectionString: hasStoredUrl
          ? z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), connectionStringSchema.optional())
          : connectionStringSchema,
      }),
    ],
    'required',
  );

export type DatabaseInput = z.infer<ReturnType<typeof buildDatabaseSchema>>;

export const databaseListParamsSchema = z.object({ ordering: orderingParam(DatabaseSortField) });

export type DatabaseListParams = z.infer<typeof databaseListParamsSchema>;
