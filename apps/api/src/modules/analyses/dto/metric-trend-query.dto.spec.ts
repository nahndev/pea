import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../../../common/pipes/validation.pipe';
import { MetricTrendQueryDto } from './metric-trend-query.dto';

describe('MetricTrendQueryDto', () => {
  const pipe = createValidationPipe();
  const validate = (query: unknown) => pipe.transform(query, { type: 'query', metatype: MetricTrendQueryDto });
  const id = '0192f6f0-1111-7222-8333-944455556666';
  const subject = '1774ce23-c32c-58aa-9b40-bd08fcfdb938';

  it('defaults to 20 analyses and no picks', async () => {
    await expect(validate({})).resolves.toMatchObject({ limit: 20 });
  });

  it('wraps a single pick into an array', async () => {
    await expect(validate({ pick: `${id}:${subject}` })).resolves.toMatchObject({ pick: [`${id}:${subject}`] });
  });

  it('accepts several picks, including an empty subject', async () => {
    const pick = [`${id}:`, `${id}:${subject}`];
    await expect(validate({ pick })).resolves.toMatchObject({ pick });
  });

  it.each([
    ['a pick without a metric id', { pick: `:${subject}` }],
    ['a pick that is not a uuid', { pick: 'P50:' }],
    ['a pick with a subject that is not a uuid', { pick: `${id}:GET /a` }],
    ['more than 10 picks', { pick: Array.from({ length: 11 }, () => `${id}:`) }],
  ])('rejects %s', async (_, query) => {
    await expect(validate(query)).rejects.toBeInstanceOf(BadRequestException);
  });
});
