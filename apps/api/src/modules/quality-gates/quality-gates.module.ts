import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { MetricConditionsController } from './metric-conditions.controller';
import { MetricConditionsRepository } from './metric-conditions.repository';
import { MetricConditionsService } from './metric-conditions.service';
import { MetricEvaluationsRepository } from './metric-evaluations.repository';
import { QualityGatesController } from './quality-gates.controller';
import { QualityGatesRepository } from './quality-gates.repository';
import { QualityGatesService } from './quality-gates.service';

@Module({
  imports: [MetricsModule],
  controllers: [QualityGatesController, MetricConditionsController],
  providers: [
    QualityGatesService,
    QualityGatesRepository,
    MetricEvaluationsRepository,
    MetricConditionsService,
    MetricConditionsRepository,
  ],
  exports: [QualityGatesService],
})
export class QualityGatesModule {}
