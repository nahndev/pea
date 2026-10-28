import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListIssuesQueryDto } from '../issues/dto/list-issues-query.dto';
import { AnalysisResultService } from './analysis-result.service';

@ApiTags('analyses')
@Controller('analyses/:analysisId')
export class AnalysisResultController {
  constructor(private readonly analysisResultService: AnalysisResultService) {}

  @Get('issues')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  listIssues(@Param('analysisId', ParseUUIDPipe) analysisId: string, @Query() query: ListIssuesQueryDto) {
    return this.analysisResultService.listIssues(analysisId, query);
  }

  @Get('metrics')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  listMetrics(@Param('analysisId', ParseUUIDPipe) analysisId: string) {
    return this.analysisResultService.listMetrics(analysisId);
  }
}
