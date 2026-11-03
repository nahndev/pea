import { Module } from '@nestjs/common';
import { DatabaseConnectionsModule } from '../database-connections/database-connections.module';
import { FilesModule } from '../files/files.module';
import { IssuesModule } from '../issues/issues.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { EndpointPercentileHandler } from './handlers/api/endpoint-percentile.handler';
import { IssueCountHandler } from './handlers/common/issue-count.handler';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { PercentileHandler } from './handlers/api/percentile.handler';
import { TableRowsHandler } from './handlers/database/table-rows.handler';
import { MetricResultsRepository } from './metric-results.repository';
import { MetricsController } from './metrics.controller';
import { MetricsRepository } from './metrics.repository';
import { MetricsService } from './metrics.service';

@Module({
  imports: [DatabaseConnectionsModule, FilesModule, IssuesModule, SubjectsModule],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    MetricsRepository,
    MetricResultsRepository,
    PercentileHandler,
    IssueCountHandler,
    EndpointPercentileHandler,
    TableRowsHandler,
    MetricHandlerFactory,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
