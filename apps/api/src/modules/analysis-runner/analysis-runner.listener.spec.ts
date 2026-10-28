import type { Analysis } from '../../generated/client';
import { AnalysisRunnerListener } from './analysis-runner.listener';
import { AnalysisRunnerService } from './analysis-runner.service';

describe('AnalysisRunnerListener', () => {
  it('runs the analysis that was created', async () => {
    const analysisRunnerService = { run: jest.fn().mockResolvedValue(undefined) };
    const analysisRunnerListener = new AnalysisRunnerListener(
      analysisRunnerService as unknown as AnalysisRunnerService,
    );

    await analysisRunnerListener.handleAnalysisCreated({ id: 'an-1' } as Analysis);

    expect(analysisRunnerService.run).toHaveBeenCalledWith({ analysisId: 'an-1' });
  });
});
