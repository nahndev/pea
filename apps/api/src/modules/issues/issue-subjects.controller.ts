import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Permission } from '@tomato/constants';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UpdateIssueSubjectDto } from './dto/update-issue-subject.dto';
import { IssuesService } from './issues.service';

@ApiTags('issue-subjects')
@Controller('issue-subjects')
@RequirePermission(Permission.BRANCH_ANALYSIS)
export class IssueSubjectsController {
  constructor(private readonly issuesService: IssuesService) {}

  @Patch(':id')
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateIssueSubjectDto) {
    return this.issuesService.updateSubject(id, dto);
  }
}
