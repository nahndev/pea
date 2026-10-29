import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { IssuesModule } from '../issues/issues.module';
import { EndpointPercentileHandler } from './handlers/endpoint-percentile.handler';
import { IssueCountHandler } from './handlers/issue-count.handler';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { PercentileHandler } from './handlers/percentile.handler';
import { MetricResultsRepository } from './metric-results.repository';
import { MetricsController } from './metrics.controller';
import { MetricsRepository } from './metrics.repository';
import { MetricsService } from './metrics.service';

@Module({
  imports: [FilesModule, IssuesModule],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    MetricsRepository,
    MetricResultsRepository,
    PercentileHandler,
    IssueCountHandler,
    EndpointPercentileHandler,
    MetricHandlerFactory,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
