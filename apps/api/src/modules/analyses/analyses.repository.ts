import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AnalysisContextFile, AnalysisWithContexts } from './analyses.types';

interface CreateAnalysisData {
  branchId: string;
  mergeRequestIid?: number;
  files: AnalysisContextFile[];
}

@Injectable()
export class AnalysesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create({ branchId, mergeRequestIid, files }: CreateAnalysisData): Promise<AnalysisWithContexts> {
    return this.prismaService.analysis.create({
      data: {
        branchId,
        mergeRequestIid,
        contexts: { create: files },
      },
      include: { contexts: true },
    });
  }

  findById(id: string): Promise<AnalysisWithContexts | null> {
    return this.prismaService.analysis.findUnique({ where: { id }, include: { contexts: true } });
  }
}
