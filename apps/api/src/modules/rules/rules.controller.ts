import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRuleDto } from './dto/create-rule.dto';
import { ListRulesQueryDto } from './dto/list-rules-query.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RulesService } from './rules.service';

@ApiTags('rules')
@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOkResponse()
  findAll(@Query() { schema }: ListRulesQueryDto) {
    return this.rulesService.findAll({ schema });
  }

  @Post()
  @ApiCreatedResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  create(@Body() dto: CreateRuleDto) {
    return this.rulesService.create(dto);
  }

  @Get(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRuleDto) {
    return this.rulesService.update(id, dto);
  }
}
