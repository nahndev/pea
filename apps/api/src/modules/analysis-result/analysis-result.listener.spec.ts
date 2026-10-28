import type { Analysis } from '../../generated/client';
import { AnalysisResultListener } from './analysis-result.listener';
import { AnalysisResultService } from './analysis-result.service';

describe('AnalysisResultListener', () => {
  it('runs the analysis that was created', async () => {
    const analysisResultService = { run: jest.fn().mockResolvedValue(undefined) };
    const analysisResultListener = new AnalysisResultListener(
      analysisResultService as unknown as AnalysisResultService,
    );

    await analysisResultListener.handleAnalysisCreated({ id: 'an-1' } as Analysis);

    expect(analysisResultService.run).toHaveBeenCalledWith({ analysisId: 'an-1' });
  });
});
