import { Module } from '@nestjs/common';
import { DatabaseConnectionsService } from './database-connections.service';

@Module({
  providers: [DatabaseConnectionsService],
  exports: [DatabaseConnectionsService],
})
export class DatabaseConnectionsModule {}
