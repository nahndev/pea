import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../../../common/pipes/validation.pipe';
import { CreateRuleDto } from './create-rule.dto';

describe('CreateRuleDto', () => {
  const pipe = createValidationPipe();
  const validate = (body: unknown) => pipe.transform(body, { type: 'body', metatype: CreateRuleDto });
  const valid = { schema: 'API', type: 'SLOW_API', description: '  Strict  ', severity: 'HIGH', config: { thresholdMs: 800 } };

  it('accepts a valid body and trims the description', async () => {
    await expect(validate(valid)).resolves.toMatchObject({ description: 'Strict', config: { thresholdMs: 800 } });
  });

  it.each([
    ['unknown schema', { ...valid, schema: 'NOPE' }],
    ['missing schema', { ...valid, schema: undefined }],
    ['unknown type', { ...valid, type: 'NOPE' }],
    ['blank description', { ...valid, description: '   ' }],
    ['unknown severity', { ...valid, severity: 'URGENT' }],
    ['missing config', { ...valid, config: undefined }],
    ['invalid config value', { ...valid, config: { thresholdMs: 0 } }],
    ['unknown config key', { ...valid, config: { thresholdMs: 800, other: 1 } }],
    ['unknown field', { ...valid, baseRuleId: 'x' }],
  ])('rejects %s', async (_, body) => {
    await expect(validate(body)).rejects.toBeInstanceOf(BadRequestException);
  });
});
