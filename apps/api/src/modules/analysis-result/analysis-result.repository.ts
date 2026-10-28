import { Injectable } from "@nestjs/common";
import type { AnalysisResultStatus } from "@tomato/constants";
import type { AnalysisResult } from "../../generated/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalysisResultRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(analysisId: string): Promise<AnalysisResult> {
    return this.prismaService.analysisResult.create({ data: { analysisId } });
  }

  finish(
    id: string,
    data: { status: AnalysisResultStatus; issueCount: number },
  ): Promise<AnalysisResult> {
    return this.prismaService.analysisResult.update({ where: { id }, data });
  }

  findLatestByAnalysis(analysisId: string): Promise<AnalysisResult | null> {
    return this.prismaService.analysisResult.findFirst({
      where: { analysisId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }
}
