import { BadRequestException } from '@nestjs/common';
import { AnalysisSchema, ErrorCode } from '@tomato/constants';
import { Readable } from 'node:stream';
import type { StorageService, StoredFile } from '../files/storage.service';
import type { AddOnRegistry } from './add-on.registry';
import { AddOnsService } from './add-ons.service';

const UPLOAD = { originalname: 'raw.log' } as Express.Multer.File;
const STORED: StoredFile = { file: 'raw.log', path: 'p-1' };

describe('AddOnsService', () => {
  let written: string;
  let registry: jest.Mocked<Pick<AddOnRegistry, 'list' | 'converterFor'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'open' | 'saveStream' | 'remove'>>;
  let addOnsService: AddOnsService;

  const uploadOf = (text: string) => storageService.open.mockReturnValue(Readable.from([Buffer.from(text)]));

  beforeEach(() => {
    written = '';
    registry = { list: jest.fn(), converterFor: jest.fn().mockReturnValue((line: string) => (line === 'bad' ? null : { line })) };
    storageService = {
      open: jest.fn(),
      saveStream: jest.fn(async (_file: string, source: Readable) => {
        for await (const chunk of source) written += String(chunk);
        return STORED;
      }),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    addOnsService = new AddOnsService(registry as unknown as AddOnRegistry, storageService as unknown as StorageService);
  });

  it('streams the upload through the converter of the add-on into storage', async () => {
    uploadOf('a\nbad\nb\n');

    await expect(addOnsService.convert('leaneo', AnalysisSchema.API, UPLOAD)).resolves.toBe(STORED);

    expect(registry.converterFor).toHaveBeenCalledWith('leaneo', AnalysisSchema.API);
    expect(storageService.open).toHaveBeenCalledWith(UPLOAD);
    expect(storageService.saveStream).toHaveBeenCalledWith('raw.log', expect.any(Readable));
    expect(written).toBe('{"line":"a"}\n{"line":"b"}\n');
  });

  it('removes the output and throws LOG_FILE_INVALID when no line converts', async () => {
    uploadOf('bad\n\n');

    const error = await addOnsService.convert('leaneo', AnalysisSchema.API, UPLOAD).catch((e: BadRequestException) => e);

    expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.LOG_FILE_INVALID });
    expect(storageService.remove).toHaveBeenCalledWith([STORED]);
  });
});
