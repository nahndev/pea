import { BadRequestException } from '@nestjs/common';
import { AnalysisSchema } from '@tomato/constants';
import { createValidationPipe } from '../../../common/pipes/validation.pipe';
import { CreateAnalysesDto } from './create-analyses.dto';

/** Multer builds `analyses[i][field]` items as prototype-less objects */
const item = (fields: Record<string, string>) => Object.assign(Object.create(null) as object, fields);

describe('CreateAnalysesDto', () => {
  const pipe = createValidationPipe();
  const validate = (body: unknown) => pipe.transform(body, { type: 'body', metatype: CreateAnalysesDto });
  const api = { repo: ' feat/x ', schema: AnalysisSchema.API, title: 'Release 1' };

  it('validates and trims each item', async () => {
    await expect(validate({ analyses: [item(api)] })).resolves.toEqual({
      analyses: [{ repo: 'feat/x', schema: AnalysisSchema.API, title: 'Release 1' }],
    });
  });

  it.each([
    ['no item', { analyses: [] }],
    ['more than 20 items', { analyses: Array.from({ length: 21 }, () => item(api)) }],
    ['a sparse index', { analyses: Object.assign([], { 1: item(api) }) }],
    ['an invalid item', { analyses: [item(api), item({ ...api, schema: 'NOPE' })] }],
    ['an unknown item field', { analyses: [item({ ...api, extra: 'x' })] }],
    ['items keyed by name', { analyses: { a: item(api) } }],
  ])('rejects %s', async (_, body) => {
    await expect(validate(body)).rejects.toBeInstanceOf(BadRequestException);
  });
});
