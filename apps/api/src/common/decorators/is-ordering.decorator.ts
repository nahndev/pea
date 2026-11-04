import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, ValidateBy } from 'class-validator';
import { type Ordering, parseOrdering } from '../sort/sort';

/** Parses a JSON:API style `ordering` query, e.g. `-createdAt,name`, and allows only the given fields once each */
export function IsOrdering(fields: Record<string, string>) {
  const allowed: readonly string[] = Object.values(fields);
  return applyDecorators(
    IsOptional(),
    Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? parseOrdering(value) : value)),
    ValidateBy({
      name: 'isOrdering',
      validator: {
        validate: (value: unknown) =>
          Array.isArray(value) &&
          (value as Ordering<string>).every(({ field }) => allowed.includes(field)) &&
          new Set((value as Ordering<string>).map(({ field }) => field)).size === value.length,
      },
    }),
  );
}
