import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppConfigModule } from '@tomato/config';
import { HealthController } from './health/health.controller';
import { ReposModule } from './modules/repos/repos.module';
import { AnalysisResultModule } from './modules/analysis-result/analysis-result.module';
import { AddOnsModule } from './modules/add-ons/add-ons.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConditionsModule } from './modules/conditions/conditions.module';
import { DatabasesModule } from './modules/databases/databases.module';
import { GroupsModule } from './modules/groups/groups.module';
import { IssuesModule } from './modules/issues/issues.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { RulesModule } from './modules/rules/rules.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AppConfigModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    GroupsModule,
    UsersModule,
    ReposModule,
    AnalysesModule,
    AddOnsModule,
    RulesModule,
    IssuesModule,
    MetricsModule,
    ConditionsModule,
    DatabasesModule,
    AnalysisResultModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
