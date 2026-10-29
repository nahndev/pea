import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../../../common/pipes/validation.pipe';
import { UpdateMetricConditionDto } from './update-metric-condition.dto';

describe('UpdateMetricConditionDto', () => {
  const pipe = createValidationPipe();
  const validate = (body: unknown) => pipe.transform(body, { type: 'body', metatype: UpdateMetricConditionDto });

  it.each([{ operator: 'LTE' }, { isActive: false }, { threshold: 0 }, { operator: 'GT', threshold: 2500.5 }, {}])('accepts %j', async (body) => {
    await expect(validate(body)).resolves.toMatchObject(body);
  });

  it.each([
    ['an unknown operator', { operator: 'EQ' }],
    ['a negative threshold', { threshold: -1 }],
    ['a non-numeric threshold', { threshold: '10' }],
    ['a non-boolean isActive', { isActive: 'no' }],
    ['an unknown field', { metricId: 'x' }],
  ])('rejects %s', async (_, body) => {
    await expect(validate(body)).rejects.toBeInstanceOf(BadRequestException);
  });
});
