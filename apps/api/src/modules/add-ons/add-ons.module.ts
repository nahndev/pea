import { Module } from '@nestjs/common';
import { LeaneoExceptionsConvertController } from './leaneo-exceptions-convert/leaneo-exceptions-convert.controller';
import { LeaneoExceptionsConvertService } from './leaneo-exceptions-convert/leaneo-exceptions-convert.service';
import { LeaneoSlowApiConvertController } from './leaneo-slow-api-convert/leaneo-slow-api-convert.controller';
import { LeaneoSlowApiConvertService } from './leaneo-slow-api-convert/leaneo-slow-api-convert.service';

@Module({
  controllers: [LeaneoSlowApiConvertController, LeaneoExceptionsConvertController],
  providers: [LeaneoSlowApiConvertService, LeaneoExceptionsConvertService],
})
export class AddOnsModule {}
