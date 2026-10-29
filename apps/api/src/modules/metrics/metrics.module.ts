import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { IssuesModule } from '../issues/issues.module';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { IssueCountHandler } from './handlers/issue-count.handler';
import { PercentileHandler } from './handlers/percentile.handler';
import { MetricResultsRepository } from './metric-results.repository';
import { MetricsRepository } from './metrics.repository';
import { MetricsService } from './metrics.service';

@Module({
  imports: [FilesModule, IssuesModule],
  providers: [MetricsService, MetricsRepository, MetricResultsRepository, PercentileHandler, IssueCountHandler, MetricHandlerFactory],
  exports: [MetricsService],
})
export class MetricsModule {}
