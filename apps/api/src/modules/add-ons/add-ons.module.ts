import { Module } from '@nestjs/common';
import { LeaneoSlowApiConvertController } from './leaneo-slow-api-convert/leaneo-slow-api-convert.controller';
import { LeaneoSlowApiConvertService } from './leaneo-slow-api-convert/leaneo-slow-api-convert.service';

@Module({
  controllers: [LeaneoSlowApiConvertController],
  providers: [LeaneoSlowApiConvertService],
})
export class AddOnsModule {}
