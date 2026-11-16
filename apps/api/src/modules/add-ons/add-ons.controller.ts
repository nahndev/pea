import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Permission } from '@tomato/constants';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AddOnsService } from './add-ons.service';

@ApiTags('add-ons')
@Controller('add-ons')
@RequirePermission(Permission.REPO_ANALYSIS)
export class AddOnsController {
  constructor(private readonly addOnsService: AddOnsService) {}

  @Get()
  @ApiOkResponse({ description: 'Manifests of the installed add-ons' })
  list() {
    return this.addOnsService.list();
  }
}
