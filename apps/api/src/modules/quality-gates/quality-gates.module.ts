import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { MetricEvaluationsRepository } from './metric-evaluations.repository';
import { QualityGatesRepository } from './quality-gates.repository';
import { QualityGatesService } from './quality-gates.service';

@Module({
  imports: [MetricsModule],
  providers: [QualityGatesService, QualityGatesRepository, MetricEvaluationsRepository],
  exports: [QualityGatesService],
})
export class QualityGatesModule {}
