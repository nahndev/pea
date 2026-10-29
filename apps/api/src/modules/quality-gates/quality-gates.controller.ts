import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { QualityGatesService } from './quality-gates.service';

@ApiTags('quality-gates')
@Controller('quality-gates')
export class QualityGatesController {
  constructor(private readonly qualityGatesService: QualityGatesService) {}

  @Get()
  @ApiOkResponse()
  findAll() {
    return this.qualityGatesService.findAll();
  }
}
