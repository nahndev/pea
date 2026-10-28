import { NotFoundException } from '@nestjs/common';
import { AnalysisResultStatus, ErrorCode } from '@tomato/constants';
import { AnalysesService } from '../analyses/analyses.service';
import { IssuesService } from '../issues/issues.service';
import { RuleHandlerFactory } from '../rules/handlers/rule-handler.factory';
import type { RuleHandler } from '../rules/handlers/rule-handler.types';
import { RulesService } from '../rules/rules.service';
import { AnalysisResultRepository } from './analysis-result.repository';
import { AnalysisResultService } from './analysis-result.service';

describe('AnalysisResultService', () => {
  let analysisResultRepository: jest.Mocked<Pick<AnalysisResultRepository, 'create' | 'finish' | 'findById' | 'findLatest'>>;
  let analysesService: jest.Mocked<Pick<AnalysesService, 'findOne'>>;
  let rulesService: jest.Mocked<Pick<RulesService, 'listAll'>>;
  let issuesService: jest.Mocked<Pick<IssuesService, 'createMany'>>;
  let ruleHandlerFactory: jest.Mocked<Pick<RuleHandlerFactory, 'supports' | 'create'>>;
  let handler: jest.Mocked<RuleHandler>;
  let analysisResultService: AnalysisResultService;

  const contexts = [{ id: 'c-1' }, { id: 'c-2' }];
  const ruleList = [
    { id: 'r-1', type: 'P90_FAILURE' },
    { id: 'r-2', type: 'P95_FAILURE' },
  ];

  beforeEach(() => {
    analysisResultRepository = {
      create: jest.fn().mockResolvedValue({ id: 'res-1' }),
      finish: jest.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      findById: jest.fn(),
      findLatest: jest.fn(),
    };
    analysesService = { findOne: jest.fn().mockResolvedValue({ id: 'an-1', contexts }) };
    rulesService = { listAll: jest.fn().mockResolvedValue(ruleList) };
    issuesService = { createMany: jest.fn().mockImplementation((_, items: unknown[]) => items.length) };
    handler = { handle: jest.fn().mockResolvedValue([]) };
    ruleHandlerFactory = {
      supports: jest.fn().mockImplementation((type: string) => type === 'P90_FAILURE'),
      create: jest.fn().mockReturnValue(handler),
    };
    analysisResultService = new AnalysisResultService(
      analysisResultRepository as unknown as AnalysisResultRepository,
      analysesService as unknown as AnalysesService,
      rulesService as unknown as RulesService,
      issuesService as unknown as IssuesService,
      ruleHandlerFactory as unknown as RuleHandlerFactory,
    );
  });

  it('runs every supported rule on every context and links issues to the result', async () => {
    handler.handle.mockImplementation((rule, context) =>
      Promise.resolve([{ ruleId: rule.id, analysisContextId: context.id, description: 'failed' }]),
    );

    const result = await analysisResultService.run({ analysisId: 'an-1' });

    expect(handler.handle).toHaveBeenCalledTimes(2);
    expect(issuesService.createMany).toHaveBeenCalledWith('res-1', [
      { ruleId: 'r-1', analysisContextId: 'c-1', description: 'failed' },
    ]);
    expect(issuesService.createMany).toHaveBeenCalledWith('res-1', [
      { ruleId: 'r-1', analysisContextId: 'c-2', description: 'failed' },
    ]);
    expect(result).toMatchObject({ status: AnalysisResultStatus.COMPLETED, issueCount: 2 });
  });

  it('completes with zero issues when nothing is found', async () => {
    await expect(analysisResultService.run({ analysisId: 'an-1' })).resolves.toMatchObject({
      status: AnalysisResultStatus.COMPLETED,
      issueCount: 0,
    });
  });

  it('skips rules whose type has no handler', async () => {
    await analysisResultService.run({ analysisId: 'an-1' });
    expect(ruleHandlerFactory.create).not.toHaveBeenCalledWith('P95_FAILURE');
  });

  it('marks the result FAILED with the issues so far and rethrows', async () => {
    handler.handle
      .mockResolvedValueOnce([{ ruleId: 'r-1', analysisContextId: 'c-1', description: 'failed' }])
      .mockRejectedValueOnce(new Error('duckdb'));

    await expect(analysisResultService.run({ analysisId: 'an-1' })).rejects.toThrow('duckdb');
    expect(analysisResultRepository.finish).toHaveBeenCalledWith('res-1', {
      status: AnalysisResultStatus.FAILED,
      issueCount: 1,
    });
  });

  it('does not create a result when the analysis does not exist', async () => {
    analysesService.findOne.mockRejectedValue(
      new NotFoundException({ code: ErrorCode.ANALYSIS_NOT_FOUND }),
    );
    await expect(analysisResultService.run({ analysisId: 'missing' })).rejects.toBeInstanceOf(NotFoundException);
    expect(analysisResultRepository.create).not.toHaveBeenCalled();
  });

  it('throws ANALYSIS_RESULT_NOT_FOUND when the result is missing', async () => {
    analysisResultRepository.findById.mockResolvedValue(null);
    const error = await analysisResultService.findOne('missing').catch((e: NotFoundException) => e);
    expect((error as NotFoundException).getResponse()).toEqual({
      code: ErrorCode.ANALYSIS_RESULT_NOT_FOUND,
    });
  });

  it('returns the latest result of an analysis', async () => {
    analysisResultRepository.findLatest.mockResolvedValue({ id: 'res-2' } as never);
    await expect(analysisResultService.findLatest('an-1')).resolves.toEqual({ id: 'res-2' });
    expect(analysisResultRepository.findLatest).toHaveBeenCalledWith('an-1');
  });

  it('throws ANALYSIS_RESULT_NOT_FOUND when the analysis has no result yet', async () => {
    analysisResultRepository.findLatest.mockResolvedValue(null);
    const error = await analysisResultService.findLatest('an-1').catch((e: NotFoundException) => e);
    expect((error as NotFoundException).getResponse()).toEqual({
      code: ErrorCode.ANALYSIS_RESULT_NOT_FOUND,
    });
  });
});
