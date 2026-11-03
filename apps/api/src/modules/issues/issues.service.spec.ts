import { Severity, SubjectType } from '@tomato/constants';
import { createSubject } from '../subjects/subject';
import { SubjectsService } from '../subjects/subjects.service';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

describe('IssuesService', () => {
  let issuesRepository: jest.Mocked<Pick<IssuesRepository, 'createMany' | 'countBySeverity' | 'findPage'>>;
  let subjectsService: jest.Mocked<Pick<SubjectsService, 'createMany'>>;
  let issuesService: IssuesService;

  const items = [{ ruleId: 'r-1', description: 'failed', severity: 'HIGH' }];

  beforeEach(() => {
    issuesRepository = {
      createMany: jest.fn().mockResolvedValue(1),
      countBySeverity: jest.fn().mockResolvedValue(4),
      findPage: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    subjectsService = { createMany: jest.fn().mockResolvedValue(0) };
    issuesService = new IssuesService(
      issuesRepository as unknown as IssuesRepository,
      subjectsService as unknown as SubjectsService,
    );
  });

  it('creates the issues of an analysis result', async () => {
    await expect(issuesService.createMany('res-1', items)).resolves.toBe(1);
    expect(issuesRepository.createMany).toHaveBeenCalledWith('res-1', [{ ...items[0], subjectUuid: null }]);
  });

  it('saves the subjects before linking them to the issues', async () => {
    const cart = createSubject(SubjectType.API, 'GET /api/cart');

    await issuesService.createMany('res-1', [{ ...items[0], subject: cart }, items[0]]);

    expect(subjectsService.createMany).toHaveBeenCalledWith([cart]);
    expect(issuesRepository.createMany).toHaveBeenCalledWith('res-1', [
      { ...items[0], subjectUuid: cart.uuid },
      { ...items[0], subjectUuid: null },
    ]);
    expect(subjectsService.createMany.mock.invocationCallOrder[0]).toBeLessThan(
      issuesRepository.createMany.mock.invocationCallOrder[0],
    );
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
          subject: { uuid: 'su-1', type: 'API', description: 'GET /api/cart', createdAt: new Date() },
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
    expect(page.items[0]).toMatchObject({
      id: 'i-1',
      severity: 'HIGH',
      subject: { uuid: 'su-1', type: 'API', description: 'GET /api/cart' },
    });
  });

  it('skips the database when there is nothing to create', async () => {
    await expect(issuesService.createMany('res-1', [])).resolves.toBe(0);
    expect(issuesRepository.createMany).not.toHaveBeenCalled();
  });
});
