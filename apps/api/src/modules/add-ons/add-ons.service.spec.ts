import { AddOn, AnalysisSchema } from '@tomato/constants';
import { AddOnsService } from './add-ons.service';
import type { LeaneoExceptionsConvertService } from './leaneo-exceptions-convert/leaneo-exceptions-convert.service';
import type { LeaneoSlowApiConvertService } from './leaneo-slow-api-convert/leaneo-slow-api-convert.service';

const UPLOAD = { originalname: 'raw.log', buffer: Buffer.from('raw'), size: 3 } as Express.Multer.File;
const RESULT = { content: 'converted\n', converted: 1, skipped: 0 };

describe('AddOnsService', () => {
  const slowApi = { convert: jest.fn().mockReturnValue(RESULT) };
  const exceptions = { convert: jest.fn().mockReturnValue(RESULT) };
  const addOnsService = new AddOnsService(
    slowApi as unknown as LeaneoSlowApiConvertService,
    exceptions as unknown as LeaneoExceptionsConvertService,
  );

  beforeEach(() => jest.clearAllMocks());

  it.each([AnalysisSchema.API, AnalysisSchema.QUERY])('converts a Leaneo slow api log for %s', (schema) => {
    const file = addOnsService.convert(AddOn.LEANEO, schema, UPLOAD);

    expect(slowApi.convert).toHaveBeenCalledWith(UPLOAD);
    expect(exceptions.convert).not.toHaveBeenCalled();
    expect(file).toMatchObject({ originalname: 'raw.log', size: RESULT.content.length });
    expect(file.buffer.toString()).toBe(RESULT.content);
  });

  it('converts a Leaneo exceptions log for BUG', () => {
    addOnsService.convert(AddOn.LEANEO, AnalysisSchema.BUG, UPLOAD);

    expect(exceptions.convert).toHaveBeenCalledWith(UPLOAD);
    expect(slowApi.convert).not.toHaveBeenCalled();
  });
});
