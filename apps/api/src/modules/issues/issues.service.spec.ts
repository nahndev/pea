import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

describe('IssuesService', () => {
  let issuesRepository: jest.Mocked<Pick<IssuesRepository, 'createMany'>>;
  let issuesService: IssuesService;

  const items = [{ ruleId: 'r-1', analysisContextId: 'c-1', description: 'failed' }];

  beforeEach(() => {
    issuesRepository = { createMany: jest.fn().mockResolvedValue(1) };
    issuesService = new IssuesService(issuesRepository as unknown as IssuesRepository);
  });

  it('creates the issues of an analysis result', async () => {
    await expect(issuesService.createMany('res-1', items)).resolves.toBe(1);
    expect(issuesRepository.createMany).toHaveBeenCalledWith('res-1', items);
  });

  it('skips the database when there is nothing to create', async () => {
    await expect(issuesService.createMany('res-1', [])).resolves.toBe(0);
    expect(issuesRepository.createMany).not.toHaveBeenCalled();
  });
});
