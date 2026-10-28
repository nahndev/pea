import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalysisEvent } from '@tomato/constants';
import type { Analysis } from '../../generated/client';
import { AnalysisRunnerService } from './analysis-runner.service';

@Injectable()
export class AnalysisRunnerListener {
  constructor(private readonly analysisRunnerService: AnalysisRunnerService) {}

  @OnEvent(AnalysisEvent.CREATED)
  async handleAnalysisCreated({ id }: Analysis): Promise<void> {
    await this.analysisRunnerService.run({ analysisId: id });
  }
}
