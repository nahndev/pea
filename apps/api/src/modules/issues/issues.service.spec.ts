import { NotFoundException } from '@nestjs/common';
import { ErrorCode, IssueStatus } from '@tomato/constants';
import { AnalysisContextsService } from '../analysis-contexts/analysis-contexts.service';
import { RulesService } from '../rules/rules.service';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

describe('IssuesService', () => {
  let repository: jest.Mocked<
    Pick<IssuesRepository, 'create' | 'findById' | 'updateStatus' | 'delete'>
  >;
  let rules: jest.Mocked<Pick<RulesService, 'findOne'>>;
  let contexts: jest.Mocked<Pick<AnalysisContextsService, 'findOne'>>;
  let service: IssuesService;

  const issue = { id: 'i-1', ruleId: 'r-1', analysisContextId: 'c-1', status: IssueStatus.OPEN };
  const dto = { ruleId: 'r-1', analysisContextId: 'c-1' };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
    };
    rules = { findOne: jest.fn().mockResolvedValue({ id: 'r-1' }) };
    contexts = { findOne: jest.fn().mockResolvedValue({ id: 'c-1' }) };
    service = new IssuesService(
      repository as unknown as IssuesRepository,
      rules as unknown as RulesService,
      contexts as unknown as AnalysisContextsService,
    );
  });

  const codeOf = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: NotFoundException) => e);
    return (error as NotFoundException).getResponse();
  };

  it('creates an issue after checking the rule and the context', async () => {
    repository.create.mockResolvedValue(issue as never);
    await expect(service.create(dto)).resolves.toEqual(issue);
    expect(rules.findOne).toHaveBeenCalledWith('r-1');
    expect(contexts.findOne).toHaveBeenCalledWith('c-1');
    expect(repository.create).toHaveBeenCalledWith(dto);
  });

  it('does not create an issue for a missing rule', async () => {
    rules.findOne.mockRejectedValue(new NotFoundException({ code: ErrorCode.RULE_NOT_FOUND }));
    await expect(codeOf(service.create(dto))).resolves.toEqual({ code: ErrorCode.RULE_NOT_FOUND });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('does not create an issue for a missing context', async () => {
    contexts.findOne.mockRejectedValue(
      new NotFoundException({ code: ErrorCode.ANALYSIS_CONTEXT_NOT_FOUND }),
    );
    await expect(codeOf(service.create(dto))).resolves.toEqual({
      code: ErrorCode.ANALYSIS_CONTEXT_NOT_FOUND,
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ISSUE_NOT_FOUND when missing', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(codeOf(service.findOne('missing'))).resolves.toEqual({
      code: ErrorCode.ISSUE_NOT_FOUND,
    });
  });

  it('does not update a missing issue', async () => {
    repository.findById.mockResolvedValue(null);
    await codeOf(service.update('missing', { status: IssueStatus.RESOLVED }));
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it('updates the status of an existing issue', async () => {
    repository.findById.mockResolvedValue(issue as never);
    await service.update('i-1', { status: IssueStatus.RESOLVED });
    expect(repository.updateStatus).toHaveBeenCalledWith('i-1', IssueStatus.RESOLVED);
  });

  it('does not delete a missing issue', async () => {
    repository.findById.mockResolvedValue(null);
    await codeOf(service.remove('missing'));
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('deletes an existing issue', async () => {
    repository.findById.mockResolvedValue(issue as never);
    await service.remove('i-1');
    expect(repository.delete).toHaveBeenCalledWith('i-1');
  });
});
