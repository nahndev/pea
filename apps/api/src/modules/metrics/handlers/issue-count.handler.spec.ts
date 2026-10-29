import { MetricType } from '@tomato/constants';
import type { AnalysisContext, Metric } from '../../../generated/client';
import { IssuesService } from '../../issues/issues.service';
import { IssueCountHandler } from './issue-count.handler';

describe('IssueCountHandler', () => {
  let issuesService: jest.Mocked<Pick<IssuesService, 'countByContext'>>;
  let issueCountHandler: IssueCountHandler;

  const metric = (type: string) => ({ id: 'm-1', type }) as Metric;
  const context = { id: 'c-1' } as AnalysisContext;

  beforeEach(() => {
    issuesService = { countByContext: jest.fn().mockResolvedValue(3) };
    issueCountHandler = new IssueCountHandler(issuesService as unknown as IssuesService);
  });

  it('counts the issues of the context with the severity of the metric', async () => {
    await expect(issueCountHandler.handle(metric(MetricType.BLOCKER_ISSUE_COUNT), context, 'res-1')).resolves.toEqual([
      { value: 3 },
    ]);
    expect(issuesService.countByContext).toHaveBeenCalledWith('res-1', 'c-1', 'BLOCKER');
  });

  it('returns zero when no issue matches', async () => {
    issuesService.countByContext.mockResolvedValue(0);
    await expect(issueCountHandler.handle(metric(MetricType.LOW_ISSUE_COUNT), context, 'res-1')).resolves.toEqual([
      { value: 0 },
    ]);
  });

  it('ignores metrics that are not issue counts', async () => {
    await expect(issueCountHandler.handle(metric(MetricType.P90), context, 'res-1')).resolves.toEqual([]);
    expect(issuesService.countByContext).not.toHaveBeenCalled();
  });
});
