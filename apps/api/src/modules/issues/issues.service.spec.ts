import { NotFoundException } from '@nestjs/common';
import { IssueSubjectStatus, Severity, SortOrder, SubjectType } from '@tomato/constants';
import { createSubject, DEFAULT_SUBJECT } from '../subjects/subject';
import { SubjectsService } from '../subjects/subjects.service';
import { IssueSubjectsRepository } from './issue-subjects.repository';
import { IssuesRepository } from './issues.repository';
import { IssuesService } from './issues.service';

describe('IssuesService', () => {
  let issuesRepository: jest.Mocked<Pick<IssuesRepository, 'createMany' | 'countBySeverity' | 'countByKeys' | 'findPage' | 'findById'>>;
  let issueSubjectsRepository: jest.Mocked<Pick<IssueSubjectsRepository, 'createMany' | 'findById' | 'update'>>;
  let subjectsService: jest.Mocked<Pick<SubjectsService, 'createMany'>>;
  let issuesService: IssuesService;

  const items = [{ ruleId: 'r-1', description: 'failed', severity: 'HIGH' }];

  beforeEach(() => {
    issuesRepository = {
      createMany: jest.fn().mockResolvedValue(1),
      countBySeverity: jest.fn().mockResolvedValue(4),
      countByKeys: jest.fn().mockResolvedValue([]),
      findPage: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      findById: jest.fn(),
    };
    issueSubjectsRepository = {
      createMany: jest.fn().mockResolvedValue(0),
      findById: jest.fn(),
      update: jest.fn(),
    };
    subjectsService = { createMany: jest.fn().mockResolvedValue(0) };
    issuesService = new IssuesService(
      issuesRepository as unknown as IssuesRepository,
      issueSubjectsRepository as unknown as IssueSubjectsRepository,
      subjectsService as unknown as SubjectsService,
    );
  });

  it('gives the default subject to issues without one', async () => {
    await expect(issuesService.createMany('res-1', items)).resolves.toBe(1);
    expect(subjectsService.createMany).toHaveBeenCalledWith([DEFAULT_SUBJECT]);
    expect(issuesRepository.createMany).toHaveBeenCalledWith('res-1', [{ ...items[0], subjectUuid: DEFAULT_SUBJECT.uuid }]);
  });

  it('saves the subjects before linking them to the issues', async () => {
    const cart = createSubject(SubjectType.API, 'GET /api/cart');

    await issuesService.createMany('res-1', [{ ...items[0], subject: cart }, items[0]]);

    expect(subjectsService.createMany).toHaveBeenCalledWith([cart, DEFAULT_SUBJECT]);
    expect(issuesRepository.createMany).toHaveBeenCalledWith('res-1', [
      { ...items[0], subjectUuid: cart.uuid },
      { ...items[0], subjectUuid: DEFAULT_SUBJECT.uuid },
    ]);
    expect(subjectsService.createMany.mock.invocationCallOrder[0]).toBeLessThan(
      issuesRepository.createMany.mock.invocationCallOrder[0],
    );
  });

  it('tracks each rule and subject pair of the issues', async () => {
    const cart = createSubject(SubjectType.API, 'GET /api/cart');

    await issuesService.createMany('res-1', [{ ...items[0], subject: cart }, items[0]]);

    expect(issueSubjectsRepository.createMany).toHaveBeenCalledWith([
      { ruleId: 'r-1', subjectUuid: cart.uuid },
      { ruleId: 'r-1', subjectUuid: DEFAULT_SUBJECT.uuid },
    ]);
    expect(subjectsService.createMany.mock.invocationCallOrder[0]).toBeLessThan(
      issueSubjectsRepository.createMany.mock.invocationCallOrder[0],
    );
  });

  it('counts the issues of an analysis result by severity', async () => {
    await expect(issuesService.countBySeverity('res-1', Severity.HIGH)).resolves.toBe(4);
    expect(issuesRepository.countBySeverity).toHaveBeenCalledWith('res-1', Severity.HIGH);
  });

  it('forwards the filters and exposes the subject status of each issue', async () => {
    issuesRepository.findPage.mockResolvedValue({
      items: [
        {
          id: 'i-1',
          ruleId: 'r-1',
          subjectUuid: 'su-1',
          severity: 'HIGH',
          description: 'slow',
          subject: { uuid: 'su-1', type: 'API', description: 'GET /api/cart', createdAt: new Date() },
          issueSubject: { id: 'is-1', ruleId: 'r-1', subjectUuid: 'su-1', status: 'PLANNING' },
          createdAt: new Date('2026-10-02T10:00:00.000Z'),
          rule: { id: 'r-1', type: 'P90_FAILURE', description: 'P90 failure' },
        },
        {
          id: 'i-2',
          ruleId: 'r-2',
          subjectUuid: DEFAULT_SUBJECT.uuid,
          severity: 'HIGH',
          description: 'slow',
          subject: { ...DEFAULT_SUBJECT, createdAt: new Date() },
          issueSubject: { id: 'is-2', ruleId: 'r-2', subjectUuid: DEFAULT_SUBJECT.uuid, status: 'FIXED' },
          createdAt: new Date('2026-10-02T10:00:00.000Z'),
          rule: { id: 'r-1', type: 'P90_FAILURE', description: 'P90 failure' },
        },
      ] as never,
      total: 2,
    });
    issuesRepository.countByKeys.mockResolvedValue([{ ruleId: 'r-1', subjectUuid: 'su-1', count: 5 }]);

    const page = await issuesService.findPage('res-1', {
      status: IssueSubjectStatus.PLANNING,
      severity: Severity.HIGH,
      limit: 20,
      offset: 0,
      ordering: [{ field: 'severity', order: SortOrder.ASC }],
    });

    expect(issuesRepository.findPage).toHaveBeenCalledWith(
      'res-1',
      { status: IssueSubjectStatus.PLANNING, severity: Severity.HIGH, ruleType: undefined },
      20,
      0,
      [{ field: 'severity', order: SortOrder.ASC }],
    );
    expect(page.items[0]).toMatchObject({
      id: 'i-1',
      severity: 'HIGH',
      subject: { uuid: 'su-1', type: 'API', description: 'GET /api/cart' },
      issueSubject: { id: 'is-1', status: IssueSubjectStatus.PLANNING },
      issueCount: 5,
    });
    expect(page.items[1]).toMatchObject({
      id: 'i-2',
      subject: DEFAULT_SUBJECT,
      issueSubject: { id: 'is-2', status: IssueSubjectStatus.FIXED },
      issueCount: 0,
    });
    expect(issuesRepository.countByKeys).toHaveBeenCalledWith([
      { ruleId: 'r-1', subjectUuid: 'su-1' },
      { ruleId: 'r-2', subjectUuid: DEFAULT_SUBJECT.uuid },
    ]);
  });

  it('skips the database when there is nothing to create', async () => {
    await expect(issuesService.createMany('res-1', [])).resolves.toBe(0);
    expect(issuesRepository.createMany).not.toHaveBeenCalled();
  });

  describe('findOne', () => {
    it('returns the issue with its rule, subject, subject status and issue count', async () => {
      issuesRepository.findById.mockResolvedValue({
        id: 'i-1',
        ruleId: 'r-1',
        subjectUuid: DEFAULT_SUBJECT.uuid,
        severity: 'HIGH',
        description: 'slow',
        subject: { ...DEFAULT_SUBJECT, createdAt: new Date() },
        issueSubject: { id: 'is-1', ruleId: 'r-1', subjectUuid: DEFAULT_SUBJECT.uuid, status: 'PLANNING' },
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
        rule: { id: 'r-1', type: 'P90_FAILURE', description: 'P90 failure' },
      } as never);
      issuesRepository.countByKeys.mockResolvedValue([{ ruleId: 'r-1', subjectUuid: DEFAULT_SUBJECT.uuid, count: 3 }]);

      await expect(issuesService.findOne('i-1')).resolves.toEqual({
        id: 'i-1',
        severity: 'HIGH',
        description: 'slow',
        subject: DEFAULT_SUBJECT,
        issueSubject: { id: 'is-1', status: IssueSubjectStatus.PLANNING },
        createdAt: '2026-10-02T10:00:00.000Z',
        rule: { id: 'r-1', type: 'P90_FAILURE', description: 'P90 failure' },
        issueCount: 3,
      });
      expect(issuesRepository.countByKeys).toHaveBeenCalledWith([{ ruleId: 'r-1', subjectUuid: DEFAULT_SUBJECT.uuid }]);
    });

    it('throws ISSUE_NOT_FOUND for an unknown issue', async () => {
      issuesRepository.findById.mockResolvedValue(null);

      await expect(issuesService.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(issuesRepository.countByKeys).not.toHaveBeenCalled();
    });
  });

  describe('updateSubject', () => {
    it('updates the status of an issue subject', async () => {
      issueSubjectsRepository.findById.mockResolvedValue({ id: 'is-1', status: 'TO_REVIEW' } as never);
      issueSubjectsRepository.update.mockResolvedValue({ id: 'is-1', status: 'FIXED' } as never);

      await expect(issuesService.updateSubject('is-1', { status: IssueSubjectStatus.FIXED })).resolves.toEqual({
        id: 'is-1',
        status: IssueSubjectStatus.FIXED,
      });
      expect(issueSubjectsRepository.update).toHaveBeenCalledWith('is-1', { status: IssueSubjectStatus.FIXED });
    });

    it('throws ISSUE_SUBJECT_NOT_FOUND for an unknown issue subject', async () => {
      issueSubjectsRepository.findById.mockResolvedValue(null);

      await expect(issuesService.updateSubject('missing', { status: IssueSubjectStatus.FIXED })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(issueSubjectsRepository.update).not.toHaveBeenCalled();
    });
  });
});
