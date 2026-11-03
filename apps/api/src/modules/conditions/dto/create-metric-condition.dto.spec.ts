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

  it('accepts aggregate limits', async () => {
    const aggregates = [
      { aggregate: 'MIN', operator: 'GT', threshold: 100 },
      { aggregate: 'MEDIAN', operator: 'GTE', threshold: 50 },
    ];
    await expect(validate({ ...valid, aggregates })).resolves.toMatchObject({ aggregates });
  });

  it.each([
    ['an unknown aggregate', { ...valid, aggregates: [{ aggregate: 'P99', operator: 'GT', threshold: 1 }] }],
    ['the NONE aggregate', { ...valid, aggregates: [{ aggregate: 'NONE', operator: 'GT', threshold: 1 }] }],
    ['a duplicated aggregate', { ...valid, aggregates: [{ aggregate: 'MIN', operator: 'GT', threshold: 1 }, { aggregate: 'MIN', operator: 'LT', threshold: 2 }] }],
    ['an aggregate limit with a negative threshold', { ...valid, aggregates: [{ aggregate: 'MIN', operator: 'GT', threshold: -1 }] }],
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
