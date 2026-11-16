import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Permission } from '@tomato/constants';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AnalysesService } from './analyses.service';
import { ListRepoAnalysesQueryDto } from './dto/list-repo-analyses-query.dto';
import { MetricTrendQueryDto } from './dto/metric-trend-query.dto';

@ApiTags('repos')
@Controller('repos/:idOrSlug')
@RequirePermission(Permission.REPO_VIEW)
export class RepoAnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Get('analyses')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findAnalyses(@Param('idOrSlug') idOrSlug: string, @Query() query: ListRepoAnalysesQueryDto) {
    return this.analysesService.findByRepo(idOrSlug, query);
  }

  @Get('analysis-counts')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  countAnalyses(@Param('idOrSlug') idOrSlug: string) {
    return this.analysesService.countByRepo(idOrSlug);
  }

  @Get('metrics/trend')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  getMetricTrend(@Param('idOrSlug') idOrSlug: string, @Query() { schema, limit, pick }: MetricTrendQueryDto) {
    return this.analysesService.getMetricTrend(idOrSlug, schema, limit, pick);
  }
}
