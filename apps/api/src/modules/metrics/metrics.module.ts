import { Module } from '@nestjs/common';
import { DatabaseConnectionsModule } from '../database-connections/database-connections.module';
import { IssuesModule } from '../issues/issues.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { EndpointPercentileHandler } from './handlers/api/endpoint-percentile.handler';
import { IssueCountHandler } from './handlers/common/issue-count.handler';
import { MetricHandlerFactory } from './handlers/metric-handler.factory';
import { PercentileHandler } from './handlers/api/percentile.handler';
import { TableRowsHandler } from './handlers/database/table-rows.handler';
import { DatabaseStatHandler } from './handlers/database/database-stat.handler';
import { TableDeadTuplesHandler } from './handlers/database/table-dead-tuples.handler';
import { QueryMeanDurationHandler } from './handlers/database/query-mean-duration.handler';
import { MetricResultsRepository } from './metric-results.repository';
import { MetricsController } from './metrics.controller';
import { MetricsRepository } from './metrics.repository';
import { MetricsService } from './metrics.service';

@Module({
  imports: [DatabaseConnectionsModule, IssuesModule, SubjectsModule],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    MetricsRepository,
    MetricResultsRepository,
    PercentileHandler,
    IssueCountHandler,
    EndpointPercentileHandler,
    TableRowsHandler,
    DatabaseStatHandler,
    TableDeadTuplesHandler,
    QueryMeanDurationHandler,
    MetricHandlerFactory,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
