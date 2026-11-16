import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AnalysesService } from './analyses.service';
import { ListBranchAnalysesQueryDto } from './dto/list-branch-analyses-query.dto';
import { MetricTrendQueryDto } from './dto/metric-trend-query.dto';

@ApiTags('branches')
@Controller('branches/:idOrSlug')
export class BranchAnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Get('analyses')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findAnalyses(@Param('idOrSlug') idOrSlug: string, @Query() query: ListBranchAnalysesQueryDto) {
    return this.analysesService.findByBranch(idOrSlug, query);
  }

  @Get('analysis-counts')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  countAnalyses(@Param('idOrSlug') idOrSlug: string) {
    return this.analysesService.countByBranch(idOrSlug);
  }

  @Get('metrics/trend')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  getMetricTrend(@Param('idOrSlug') idOrSlug: string, @Query() { schema, limit, pick }: MetricTrendQueryDto) {
    return this.analysesService.getMetricTrend(idOrSlug, schema, limit, pick);
  }
}
