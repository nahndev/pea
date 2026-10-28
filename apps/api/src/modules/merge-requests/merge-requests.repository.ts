import { Injectable } from '@nestjs/common';
import type { MergeRequest } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MergeRequestsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findById(id: string): Promise<MergeRequest | null> {
    return this.prismaService.mergeRequest.findUnique({ where: { id } });
  }

  async findMany(limit: number, offset: number): Promise<{ items: MergeRequest[]; total: number }> {
    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.mergeRequest.findMany({ orderBy: { id: 'desc' }, take: limit, skip: offset }),
      this.prismaService.mergeRequest.count(),
    ]);
    return { items, total };
  }

  upsertByIid(iid: number): Promise<MergeRequest> {
    return this.prismaService.mergeRequest.upsert({ where: { iid }, create: { iid }, update: {} });
  }
}
