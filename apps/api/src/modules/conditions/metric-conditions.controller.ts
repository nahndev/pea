import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateMetricConditionDto } from './dto/create-metric-condition.dto';
import { UpdateMetricConditionDto } from './dto/update-metric-condition.dto';
import { MetricConditionsService } from './metric-conditions.service';

@ApiTags('conditions')
@Controller('conditions')
export class MetricConditionsController {
  constructor(private readonly metricConditionsService: MetricConditionsService) {}

  @Get()
  @ApiOkResponse()
  findAll() {
    return this.metricConditionsService.findAll();
  }

  @Post()
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  @ApiConflictResponse()
  create(@Body() dto: CreateMetricConditionDto) {
    return this.metricConditionsService.create(dto);
  }

  @Get(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.metricConditionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMetricConditionDto) {
    return this.metricConditionsService.update(id, dto);
  }
}
