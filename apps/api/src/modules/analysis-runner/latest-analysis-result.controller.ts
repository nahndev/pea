import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AnalysisRunnerService } from './analysis-runner.service';

@ApiTags('analyses')
@Controller('analyses')
export class LatestAnalysisResultController {
  constructor(private readonly analysisRunnerService: AnalysisRunnerService) {}

  @Get(':id/latest')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findLatest(@Param('id', ParseUUIDPipe) id: string) {
    return this.analysisRunnerService.findLatest(id);
  }
}
