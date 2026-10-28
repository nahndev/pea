import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { AnalysesRepository } from './analyses.repository';
import { AnalysesService } from './analyses.service';
import { LogStorageService } from '../analysis-contexts/log-storage.service';
import { MergeRequestsService } from '../merge-requests/merge-requests.service';

const SHA = 'a'.repeat(40);

const upload = (originalname: string) =>
  ({ originalname, buffer: Buffer.from('x') }) as Express.Multer.File;

describe('AnalysesService', () => {
  let repository: jest.Mocked<Pick<AnalysesRepository, 'create' | 'delete' | 'findById'>>;
  let mergeRequests: jest.Mocked<Pick<MergeRequestsService, 'findOrCreateByIid'>>;
  let storage: jest.Mocked<Pick<LogStorageService, 'save' | 'remove'>>;
  let service: AnalysesService;

  beforeEach(() => {
    repository = { create: jest.fn(), delete: jest.fn(), findById: jest.fn() };
    mergeRequests = { findOrCreateByIid: jest.fn().mockResolvedValue({ id: 'mr-1', iid: 7 }) };
    storage = { save: jest.fn(), remove: jest.fn() };
    service = new AnalysesService(
      repository as unknown as AnalysesRepository,
      mergeRequests as unknown as MergeRequestsService,
      storage as unknown as LogStorageService,
    );
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: BadRequestException) => e);
    return (error as BadRequestException).getResponse();
  };

  it('rejects a request without files', async () => {
    await expect(codeOf(service.create({ iid: 7, commitSha: SHA }, []))).resolves.toEqual({
      code: ErrorCode.LOG_FILE_REQUIRED,
    });
    expect(mergeRequests.findOrCreateByIid).not.toHaveBeenCalled();
  });

  it.each(['../evil.log', 'api.txt', 'a/b.log', '.log'])('rejects file name %s', async (name) => {
    await expect(codeOf(service.create({ iid: 7, commitSha: SHA }, [upload(name)]))).resolves.toEqual({
      code: ErrorCode.LOG_FILE_INVALID,
    });
  });

  it('rejects duplicated file names', async () => {
    const files = [upload('sql.log'), upload('sql.log')];
    await expect(codeOf(service.create({ iid: 7, commitSha: SHA }, files))).resolves.toEqual({
      code: ErrorCode.LOG_FILE_DUPLICATED,
    });
  });

  it('creates the merge request, the analysis and stores the files', async () => {
    const analysis = { id: 'an-1', mergeRequestId: 'mr-1', commitSha: SHA, contexts: [] };
    repository.create.mockResolvedValue(analysis as never);

    const result = await service.create({ iid: 7, commitSha: SHA }, [
      upload('api_metric.log'),
      upload('sql.log'),
    ]);

    expect(mergeRequests.findOrCreateByIid).toHaveBeenCalledWith(7);
    expect(repository.create).toHaveBeenCalledWith({
      mergeRequestId: 'mr-1',
      commitSha: SHA,
      files: ['api_metric.log', 'sql.log'],
    });
    expect(storage.save).toHaveBeenCalledWith('an-1', [
      { file: 'api_metric.log', buffer: expect.any(Buffer) },
      { file: 'sql.log', buffer: expect.any(Buffer) },
    ]);
    expect(result).toBe(analysis);
  });

  it('rolls back the analysis when storing files fails', async () => {
    repository.create.mockResolvedValue({ id: 'an-1' } as never);
    storage.save.mockRejectedValue(new Error('disk full'));

    await expect(service.create({ iid: 7, commitSha: SHA }, [upload('sql.log')])).rejects.toThrow(
      'disk full',
    );
    expect(repository.delete).toHaveBeenCalledWith('an-1');
    expect(storage.remove).toHaveBeenCalledWith('an-1');
  });

  it('throws when the analysis does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(codeOf(service.findOne('missing'))).resolves.toEqual({
      code: ErrorCode.ANALYSIS_NOT_FOUND,
    });
  });
});
