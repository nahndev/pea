import { Module } from '@nestjs/common';
import { AppConfigModule } from '@tomato/config';
import { HealthController } from './health/health.controller';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { AnalysisContextsModule } from './modules/analysis-contexts/analysis-contexts.module';
import { MergeRequestsModule } from './modules/merge-requests/merge-requests.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    MergeRequestsModule,
    AnalysesModule,
    AnalysisContextsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
