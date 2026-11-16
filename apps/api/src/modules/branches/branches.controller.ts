import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '@tomato/constants';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';

@ApiTags('branches')
@Controller('branches')
@RequirePermission(Permission.BRANCH_VIEW)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOkResponse()
  findAll(@Query() query: ListBranchesQueryDto) {
    return this.branchesService.findAll(query);
  }

  @Post()
  @RequirePermission(Permission.BRANCH_ANALYSIS)
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  async create(@Body() dto: CreateBranchDto) {
    const { id, name, slug } = await this.branchesService.create(dto.name);
    return { id, name, slug };
  }

  @Get(':idOrSlug')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    const { id, name, slug } = await this.branchesService.findOne(idOrSlug);
    return { id, name, slug };
  }

  @Delete(':idOrSlug')
  @RequirePermission(Permission.BRANCH_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param('idOrSlug') idOrSlug: string) {
    return this.branchesService.remove(idOrSlug);
  }
}
