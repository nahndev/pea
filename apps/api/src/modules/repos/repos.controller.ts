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
import { ReposService } from './repos.service';
import { CreateRepoDto } from './dto/create-repo.dto';
import { ListReposQueryDto } from './dto/list-repos-query.dto';

@ApiTags('repos')
@Controller('repos')
@RequirePermission(Permission.REPO_VIEW)
export class ReposController {
  constructor(private readonly reposService: ReposService) {}

  @Get()
  @ApiOkResponse()
  findAll(@Query() query: ListReposQueryDto) {
    return this.reposService.findAll(query);
  }

  @Post()
  @RequirePermission(Permission.REPO_ANALYSIS)
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  async create(@Body() dto: CreateRepoDto) {
    const { id, name, slug } = await this.reposService.create(dto.name);
    return { id, name, slug };
  }

  @Get(':idOrSlug')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    const { id, name, slug } = await this.reposService.findOne(idOrSlug);
    return { id, name, slug };
  }

  @Delete(':idOrSlug')
  @RequirePermission(Permission.REPO_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param('idOrSlug') idOrSlug: string) {
    return this.reposService.remove(idOrSlug);
  }
}
