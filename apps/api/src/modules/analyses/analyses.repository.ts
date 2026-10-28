import { Injectable } from '@nestjs/common';
import type { AnalysisContextType } from '@tomato/constants';
import type { Analysis } from '../../generated/client';
import type { UploadedFile } from '../files/upload.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AnalysisWithContexts } from './analyses.types';

interface CreateAnalysisData {
  mergeRequestId: string;
  commitSha: string;
  files: (UploadedFile & { type: AnalysisContextType })[];
}

@Injectable()
export class AnalysesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create({ mergeRequestId, commitSha, files }: CreateAnalysisData): Promise<AnalysisWithContexts> {
    return this.prismaService.analysis.create({
      data: {
        mergeRequestId,
        commitSha,
        contexts: { create: files },
      },
      include: { contexts: true },
    });
  }

  findById(id: string): Promise<AnalysisWithContexts | null> {
    return this.prismaService.analysis.findUnique({ where: { id }, include: { contexts: true } });
  }

  async findMany(
    mergeRequestId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: Analysis[]; total: number }> {
    const where = { mergeRequestId };
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.analysis.findMany({ where, orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prismaService.analysis.count({ where }),
    ]);
    return { items, total };
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.analysis.delete({ where: { id } });
  }
}
