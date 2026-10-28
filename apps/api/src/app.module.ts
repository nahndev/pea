import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppConfigModule } from '@tomato/config';
import { HealthController } from './health/health.controller';
import { AnalysisResultModule } from './modules/analysis-result/analysis-result.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { AnalysisContextsModule } from './modules/analysis-contexts/analysis-contexts.module';
import { IssuesModule } from './modules/issues/issues.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { MergeRequestsModule } from './modules/merge-requests/merge-requests.module';
import { QualityGatesModule } from './modules/quality-gates/quality-gates.module';
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
    MetricsModule,
    QualityGatesModule,
    AnalysisResultModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
