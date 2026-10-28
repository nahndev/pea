import { Injectable } from '@nestjs/common';
import type { Branch } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  upsertByName(name: string): Promise<Branch> {
    return this.prismaService.branch.upsert({ where: { name }, create: { name }, update: {} });
  }
}
