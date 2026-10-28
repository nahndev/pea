import { NotFoundException } from '@nestjs/common';
import { ErrorCode, IssueStatus } from '@tomato/constants';
import { AnalysisContextsService } from '../analysis-contexts/analysis-contexts.service';
import { RulesService } from '../rules/rules.service';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

describe('IssuesService', () => {
  let issuesRepository: jest.Mocked<
    Pick<IssuesRepository, 'create' | 'findById' | 'updateStatus' | 'delete'>
  >;
  let rulesService: jest.Mocked<Pick<RulesService, 'findOne'>>;
  let analysisContextsService: jest.Mocked<Pick<AnalysisContextsService, 'findOne'>>;
  let issuesService: IssuesService;

  const issue = { id: 'i-1', ruleId: 'r-1', analysisContextId: 'c-1', status: IssueStatus.OPEN };
  const dto = { ruleId: 'r-1', analysisContextId: 'c-1' };

  beforeEach(() => {
    issuesRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
    };
    rulesService = { findOne: jest.fn().mockResolvedValue({ id: 'r-1' }) };
    analysisContextsService = { findOne: jest.fn().mockResolvedValue({ id: 'c-1' }) };
    issuesService = new IssuesService(
      issuesRepository as unknown as IssuesRepository,
      rulesService as unknown as RulesService,
      analysisContextsService as unknown as AnalysisContextsService,
    );
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: NotFoundException) => e);
    return (error as NotFoundException).getResponse();
  };

  it('creates an issue after checking the rule and the context', async () => {
    issuesRepository.create.mockResolvedValue(issue as never);
    await expect(issuesService.create(dto)).resolves.toEqual(issue);
    expect(rulesService.findOne).toHaveBeenCalledWith('r-1');
    expect(analysisContextsService.findOne).toHaveBeenCalledWith('c-1');
    expect(issuesRepository.create).toHaveBeenCalledWith(dto);
  });

  it('does not create an issue for a missing rule', async () => {
    rulesService.findOne.mockRejectedValue(new NotFoundException({ code: ErrorCode.RULE_NOT_FOUND }));
    await expect(codeOf(issuesService.create(dto))).resolves.toEqual({ code: ErrorCode.RULE_NOT_FOUND });
    expect(issuesRepository.create).not.toHaveBeenCalled();
  });

  it('does not create an issue for a missing context', async () => {
    analysisContextsService.findOne.mockRejectedValue(
      new NotFoundException({ code: ErrorCode.ANALYSIS_CONTEXT_NOT_FOUND }),
    );
    await expect(codeOf(issuesService.create(dto))).resolves.toEqual({
      code: ErrorCode.ANALYSIS_CONTEXT_NOT_FOUND,
    });
    expect(issuesRepository.create).not.toHaveBeenCalled();
  });

  it('throws ISSUE_NOT_FOUND when missing', async () => {
    issuesRepository.findById.mockResolvedValue(null);
    await expect(codeOf(issuesService.findOne('missing'))).resolves.toEqual({
      code: ErrorCode.ISSUE_NOT_FOUND,
    });
  });

  it('does not update a missing issue', async () => {
    issuesRepository.findById.mockResolvedValue(null);
    await codeOf(issuesService.update('missing', { status: IssueStatus.RESOLVED }));
    expect(issuesRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('updates the status of an existing issue', async () => {
    issuesRepository.findById.mockResolvedValue(issue as never);
    await issuesService.update('i-1', { status: IssueStatus.RESOLVED });
    expect(issuesRepository.updateStatus).toHaveBeenCalledWith('i-1', IssueStatus.RESOLVED);
  });

  it('does not delete a missing issue', async () => {
    issuesRepository.findById.mockResolvedValue(null);
    await codeOf(issuesService.remove('missing'));
    expect(issuesRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes an existing issue', async () => {
    issuesRepository.findById.mockResolvedValue(issue as never);
    await issuesService.remove('i-1');
    expect(issuesRepository.delete).toHaveBeenCalledWith('i-1');
  });
});
