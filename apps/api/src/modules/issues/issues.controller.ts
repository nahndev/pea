import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Permission } from '@tomato/constants';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { IssuesService } from './issues.service';

@ApiTags('issues')
@Controller('issues')
@RequirePermission(Permission.BRANCH_VIEW)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.issuesService.findOne(id);
  }
}
