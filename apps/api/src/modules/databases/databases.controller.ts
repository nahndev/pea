import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Permission } from '@tomato/constants';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { DatabasesService } from './databases.service';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { InspectDatabaseDto } from './dto/inspect-database.dto';
import { ListDatabasesQueryDto } from './dto/list-databases-query.dto';
import { UpdateDatabaseDto } from './dto/update-database.dto';

@ApiTags('databases')
@Controller('databases')
@RequirePermission(Permission.MANAGER_DATABASE)
export class DatabasesController {
  constructor(private readonly databasesService: DatabasesService) {}

  @Get()
  @RequirePermission(Permission.MANAGER_DATABASE, Permission.REPO_ANALYSIS)
  @ApiOkResponse()
  findAll(@Query() { ordering }: ListDatabasesQueryDto) {
    return this.databasesService.findAll(ordering);
  }

  @Post()
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  @ApiUnprocessableEntityResponse()
  create(@Body() dto: CreateDatabaseDto) {
    return this.databasesService.create(dto);
  }

  @Post('inspections')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBadRequestResponse()
  inspect(@Body() dto: InspectDatabaseDto) {
    return this.databasesService.inspect(dto);
  }

  @Get(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.databasesService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  @ApiConflictResponse()
  @ApiUnprocessableEntityResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDatabaseDto) {
    return this.databasesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  @ApiConflictResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.databasesService.remove(id);
  }
}
