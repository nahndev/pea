import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../../../common/pipes/validation.pipe';
import { ListMetricsQueryDto } from './list-metrics-query.dto';
import { UpdateMetricDto } from './update-metric.dto';

describe('ListMetricsQueryDto', () => {
  const pipe = createValidationPipe();
  const validate = (query: unknown) => pipe.transform(query, { type: 'query', metatype: ListMetricsQueryDto });

  it('reads isActive from the query string', async () => {
    await expect(validate({ isActive: 'true' })).resolves.toMatchObject({ isActive: true });
    await expect(validate({ isActive: 'false' })).resolves.toMatchObject({ isActive: false });
    await expect(validate({})).resolves.toEqual({});
  });

  it('rejects any other value', async () => {
    await expect(validate({ isActive: 'yes' })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('UpdateMetricDto', () => {
  const pipe = createValidationPipe();
  const validate = (body: unknown) => pipe.transform(body, { type: 'body', metatype: UpdateMetricDto });

  it('accepts a description and an active flag and trims the description', async () => {
    await expect(validate({ description: '  P90 duration ', isActive: false })).resolves.toMatchObject({
      description: 'P90 duration',
      isActive: false,
    });
  });

  it.each([
    ['a blank description', { description: '   ' }],
    ['a description over 255 characters', { description: 'a'.repeat(256) }],
    ['a non-boolean isActive', { isActive: 'no' }],
    ['the unit', { unit: 'COUNT' }],
  ])('rejects %s', async (_, body) => {
    await expect(validate(body)).rejects.toBeInstanceOf(BadRequestException);
  });
});
