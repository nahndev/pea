import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../../../common/pipes/validation.pipe';
import { CreateMetricConditionDto } from './create-metric-condition.dto';

describe('CreateMetricConditionDto', () => {
  const pipe = createValidationPipe();
  const validate = (body: unknown) => pipe.transform(body, { type: 'body', metatype: CreateMetricConditionDto });
  const valid = {
    metricId: '0192f6f0-2222-7222-8333-944455556666',
    operator: 'GT',
    threshold: 1000,
  };

  it('accepts a valid body, including a threshold of zero', async () => {
    await expect(validate(valid)).resolves.toMatchObject(valid);
    await expect(validate({ ...valid, threshold: 0 })).resolves.toMatchObject({ threshold: 0 });
  });

  it.each([
    ['a metric id that is not a uuid', { ...valid, metricId: 'p90' }],
    ['a quality gate id (no longer supported)', { ...valid, qualityGateId: '0192f6f0-1111-7222-8333-944455556666' }],
    ['a missing metric', { ...valid, metricId: undefined }],
    ['an unknown operator', { ...valid, operator: 'EQ' }],
    ['a negative threshold', { ...valid, threshold: -1 }],
    ['a missing threshold', { ...valid, threshold: undefined }],
    ['isActive (always created active)', { ...valid, isActive: false }],
  ])('rejects %s', async (_, body) => {
    await expect(validate(body)).rejects.toBeInstanceOf(BadRequestException);
  });
});
