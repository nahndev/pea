import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AnalysesService } from './analyses.service';
import { MetricTrendQueryDto } from './dto/metric-trend-query.dto';

@ApiTags('branches')
@Controller('branches/:branchId')
export class BranchAnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Get('analyses')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findAnalyses(@Param('branchId', ParseUUIDPipe) branchId: string, @Query() query: PaginationQueryDto) {
    return this.analysesService.findByBranch(branchId, query);
  }

  @Get('metrics/trend')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  getMetricTrend(@Param('branchId', ParseUUIDPipe) branchId: string, @Query() { limit, pick }: MetricTrendQueryDto) {
    return this.analysesService.getMetricTrend(branchId, limit, pick);
  }
}
