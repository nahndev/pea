import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AddOnsService } from './add-ons.service';

@ApiTags('add-ons')
@Controller('add-ons')
export class AddOnsController {
  constructor(private readonly addOnsService: AddOnsService) {}

  @Get()
  @ApiOkResponse({ description: 'Manifests of the installed add-ons' })
  list() {
    return this.addOnsService.list();
  }
}
