import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { MetricConditionsController } from './metric-conditions.controller';
import { MetricConditionsRepository } from './metric-conditions.repository';
import { MetricConditionsService } from './metric-conditions.service';
import { MetricEvaluationsRepository } from './metric-evaluations.repository';

@Module({
  imports: [MetricsModule],
  controllers: [MetricConditionsController],
  providers: [MetricConditionsService, MetricConditionsRepository, MetricEvaluationsRepository],
  exports: [MetricConditionsService],
})
export class ConditionsModule {}
