import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AnalysisResultService } from './analysis-result.service';

@ApiTags('analyses')
@Controller('analyses')
export class LatestAnalysisResultController {
  constructor(private readonly analysisResultService: AnalysisResultService) {}

  @Get(':id/latest')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findLatest(@Param('id', ParseUUIDPipe) id: string) {
    return this.analysisResultService.findLatest(id);
  }
}
