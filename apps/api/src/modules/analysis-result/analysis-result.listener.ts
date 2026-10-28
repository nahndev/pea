import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalysisEvent } from '@tomato/constants';
import type { Analysis } from '../../generated/client';
import { AnalysisResultService } from './analysis-result.service';

@Injectable()
export class AnalysisResultListener {
  constructor(private readonly analysisResultService: AnalysisResultService) {}

  @OnEvent(AnalysisEvent.CREATED)
  async handleAnalysisCreated({ id }: Analysis): Promise<void> {
    await this.analysisResultService.run({ analysisId: id });
  }
}
