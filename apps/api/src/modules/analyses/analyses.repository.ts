import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Analysis, AnalysisWithContexts } from './entities/analysis.entity';

interface CreateAnalysisData {
  mergeRequestId: string;
  commitSha: string;
  files: string[];
}

@Injectable()
export class AnalysesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create({ mergeRequestId, commitSha, files }: CreateAnalysisData): Promise<AnalysisWithContexts> {
    return this.prisma.analysis.create({
      data: {
        mergeRequestId,
        commitSha,
        contexts: { create: files.map((file) => ({ file })) },
      },
      include: { contexts: true },
    });
  }

  findById(id: string): Promise<AnalysisWithContexts | null> {
    return this.prisma.analysis.findUnique({ where: { id }, include: { contexts: true } });
  }

  async findMany(
    mergeRequestId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<{ items: Analysis[]; total: number }> {
    const where = { mergeRequestId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.analysis.findMany({ where, orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prisma.analysis.count({ where }),
    ]);
    return { items, total };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.analysis.delete({ where: { id } });
  }
}
