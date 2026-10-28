import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { PercentileHandler } from './handlers/percentile.handler';
import { MetricResultsRepository } from './metric-results.repository';
import { MetricsRepository } from './metrics.repository';
import { MetricsService } from './metrics.service';

@Module({
  imports: [FilesModule],
  providers: [MetricsService, MetricsRepository, MetricResultsRepository, PercentileHandler, MetricHandlerFactory],
  exports: [MetricsService],
})
export class MetricsModule {}
