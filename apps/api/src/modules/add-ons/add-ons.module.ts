import { Module } from '@nestjs/common';
import { AddOnsService } from './add-ons.service';
import { LeaneoExceptionsConvertService } from './leaneo-exceptions-convert/leaneo-exceptions-convert.service';
import { LeaneoSlowApiConvertService } from './leaneo-slow-api-convert/leaneo-slow-api-convert.service';

@Module({
  providers: [AddOnsService, LeaneoSlowApiConvertService, LeaneoExceptionsConvertService],
  exports: [AddOnsService],
})
export class AddOnsModule {}
