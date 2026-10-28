import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppConfigModule } from '@tomato/config';
import { HealthController } from './health/health.controller';
import { AnalysisRunnerModule } from './modules/analysis-runner/analysis-runner.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { AnalysisContextsModule } from './modules/analysis-contexts/analysis-contexts.module';
import { IssuesModule } from './modules/issues/issues.module';
import { MergeRequestsModule } from './modules/merge-requests/merge-requests.module';
import { RulesModule } from './modules/rules/rules.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AppConfigModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    MergeRequestsModule,
    AnalysesModule,
    AnalysisContextsModule,
    RulesModule,
    IssuesModule,
    AnalysisRunnerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
