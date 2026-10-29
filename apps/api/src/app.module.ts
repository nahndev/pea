import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppConfigModule } from '@tomato/config';
import { HealthController } from './health/health.controller';
import { AddOnsModule } from './modules/add-ons/add-ons.module';
import { BranchesModule } from './modules/branches/branches.module';
import { AnalysisResultModule } from './modules/analysis-result/analysis-result.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { IssuesModule } from './modules/issues/issues.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { QualityGatesModule } from './modules/quality-gates/quality-gates.module';
import { RulesModule } from './modules/rules/rules.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AppConfigModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    BranchesModule,
    AnalysesModule,
    RulesModule,
    IssuesModule,
    MetricsModule,
    QualityGatesModule,
    AnalysisResultModule,
    AddOnsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
