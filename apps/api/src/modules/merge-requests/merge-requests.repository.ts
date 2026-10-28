import { Injectable } from '@nestjs/common';
import type { MergeRequest } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MergeRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<MergeRequest | null> {
    return this.prisma.mergeRequest.findUnique({ where: { id } });
  }

  async findMany(limit: number, offset: number): Promise<{ items: MergeRequest[]; total: number }> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.mergeRequest.findMany({ orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prisma.mergeRequest.count(),
    ]);
    return { items, total };
  }

  upsertByIid(iid: number): Promise<MergeRequest> {
    return this.prisma.mergeRequest.upsert({ where: { iid }, create: { iid }, update: {} });
  }
}
