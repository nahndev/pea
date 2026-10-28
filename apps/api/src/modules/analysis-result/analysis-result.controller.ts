import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnalysisResultService } from './analysis-result.service';
import { ListAnalysisResultsQueryDto } from './dto/list-analysis-results-query.dto';
import { RunAnalysisDto } from './dto/run-analysis.dto';

@ApiTags('analysis-results')
@Controller('analysis-results')
export class AnalysisResultController {
  constructor(private readonly analysisResultService: AnalysisResultService) {}

  @Post()
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  run(@Body() dto: RunAnalysisDto) {
    return this.analysisResultService.run(dto);
  }

  @Get()
  @ApiOkResponse()
  findAll(@Query() query: ListAnalysisResultsQueryDto) {
    return this.analysisResultService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.analysisResultService.findOne(id);
  }
}
