import { Module } from '@nestjs/common';
import { DatabaseConnectionsModule } from '../database-connections/database-connections.module';
import { DatabasesController } from './databases.controller';
import { DatabasesRepository } from './databases.repository';
import { DatabasesService } from './databases.service';

@Module({
  imports: [DatabaseConnectionsModule],
  controllers: [DatabasesController],
  providers: [DatabasesService, DatabasesRepository],
  exports: [DatabasesService],
})
export class DatabasesModule {}
