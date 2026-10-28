import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnalysisRunnerService } from './analysis-runner.service';
import { ListAnalysisResultsQueryDto } from './dto/list-analysis-results-query.dto';
import { RunAnalysisDto } from './dto/run-analysis.dto';

@ApiTags('analysis-results')
@Controller('analysis-results')
export class AnalysisRunnerController {
  constructor(private readonly analysisRunnerService: AnalysisRunnerService) {}

  @Post()
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  run(@Body() dto: RunAnalysisDto) {
    return this.analysisRunnerService.run(dto);
  }

  @Get()
  @ApiOkResponse()
  findAll(@Query() query: ListAnalysisResultsQueryDto) {
    return this.analysisRunnerService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.analysisRunnerService.findOne(id);
  }
}
