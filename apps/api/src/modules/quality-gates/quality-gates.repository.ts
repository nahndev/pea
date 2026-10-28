import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { QualityGateWithConditions } from './quality-gates.types';

@Injectable()
export class QualityGatesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAllWithConditions(): Promise<QualityGateWithConditions[]> {
    return this.prismaService.qualityGate.findMany({
      orderBy: { id: 'asc' },
      include: { conditions: { orderBy: { id: 'asc' } } },
    });
  }
}
