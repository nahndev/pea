import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Permission } from '@tomato/constants';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ListMetricHistoryQueryDto } from './dto/list-metric-history-query.dto';
import { ListMetricsQueryDto } from './dto/list-metrics-query.dto';
import { UpdateMetricDto } from './dto/update-metric.dto';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
@RequirePermission(Permission.MANAGER_METRIC)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @RequirePermission(Permission.MANAGER_METRIC, Permission.MANAGER_CONDITION)
  @ApiOkResponse()
  findAll(@Query() { isActive, schema, ordering }: ListMetricsQueryDto) {
    return this.metricsService.findAll({ isActive, schema }, ordering);
  }

  @Get(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.metricsService.getById(id);
  }

  @Get(':id/subjects')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findSubjects(@Param('id', ParseUUIDPipe) id: string) {
    return this.metricsService.findSubjects(id);
  }

  @Get(':id/results')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findHistory(@Param('id', ParseUUIDPipe) id: string, @Query() { limit, offset, ordering }: ListMetricHistoryQueryDto) {
    return this.metricsService.findHistory(id, limit, offset, ordering);
  }

  @Patch(':id')
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMetricDto) {
    return this.metricsService.update(id, dto);
  }
}
