import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';

@ApiTags('branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOkResponse()
  findAll(@Query() query: ListBranchesQueryDto) {
    return this.branchesService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const { id: branchId, name } = await this.branchesService.findOne(id);
    return { id: branchId, name };
  }
}
