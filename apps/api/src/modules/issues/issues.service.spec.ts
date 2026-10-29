import { Severity } from '@tomato/constants';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

describe('IssuesService', () => {
  let issuesRepository: jest.Mocked<Pick<IssuesRepository, 'createMany' | 'countBySeverity' | 'findPage'>>;
  let issuesService: IssuesService;

  const items = [{ ruleId: 'r-1', description: 'failed', severity: 'HIGH' }];

  beforeEach(() => {
    issuesRepository = {
      createMany: jest.fn().mockResolvedValue(1),
      countBySeverity: jest.fn().mockResolvedValue(4),
      findPage: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    issuesService = new IssuesService(issuesRepository as unknown as IssuesRepository);
  });

  it('creates the issues of an analysis result', async () => {
    await expect(issuesService.createMany('res-1', items)).resolves.toBe(1);
    expect(issuesRepository.createMany).toHaveBeenCalledWith('res-1', items);
  });

  it('counts the issues of an analysis result by severity', async () => {
    await expect(issuesService.countBySeverity('res-1', Severity.HIGH)).resolves.toBe(4);
    expect(issuesRepository.countBySeverity).toHaveBeenCalledWith('res-1', Severity.HIGH);
  });

  it('forwards the severity filter and exposes the severity of each issue', async () => {
    issuesRepository.findPage.mockResolvedValue({
      items: [
        {
          id: 'i-1',
          status: 'OPEN',
          severity: 'HIGH',
          description: 'slow',
          createdAt: new Date('2026-10-02T10:00:00.000Z'),
          rule: { type: 'P90_FAILURE', description: 'P90 failure' },
        },
      ] as never,
      total: 1,
    });

    const page = await issuesService.findPage('res-1', { severity: Severity.HIGH, limit: 20, offset: 0 });

    expect(issuesRepository.findPage).toHaveBeenCalledWith(
      'res-1',
      { status: undefined, severity: Severity.HIGH, ruleType: undefined },
      20,
      0,
    );
    expect(page.items[0]).toMatchObject({ id: 'i-1', severity: 'HIGH' });
  });

  it('skips the database when there is nothing to create', async () => {
    await expect(issuesService.createMany('res-1', [])).resolves.toBe(0);
    expect(issuesRepository.createMany).not.toHaveBeenCalled();
  });
});
