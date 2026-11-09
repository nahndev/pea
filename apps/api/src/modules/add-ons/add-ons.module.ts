import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { AddOnRegistry } from './add-on.registry';
import { AddOnsController } from './add-ons.controller';
import { AddOnsService } from './add-ons.service';

@Module({
  imports: [FilesModule],
  controllers: [AddOnsController],
  providers: [AddOnRegistry, AddOnsService],
  exports: [AddOnsService],
})
export class AddOnsModule {}
