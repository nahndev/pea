import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListMetricsQueryDto } from './dto/list-metrics-query.dto';
import { UpdateMetricDto } from './dto/update-metric.dto';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOkResponse()
  findAll(@Query() { isActive, schema }: ListMetricsQueryDto) {
    return this.metricsService.findAll({ isActive, schema });
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

  @Patch(':id')
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMetricDto) {
    return this.metricsService.update(id, dto);
  }
}
