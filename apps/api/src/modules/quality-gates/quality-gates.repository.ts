import { Injectable } from '@nestjs/common';
import type { QualityGate } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { QualityGateWithConditions } from './quality-gates.types';

@Injectable()
export class QualityGatesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<QualityGate[]> {
    return this.prismaService.qualityGate.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string): Promise<QualityGate | null> {
    return this.prismaService.qualityGate.findUnique({ where: { id } });
  }

  findAllWithConditions(): Promise<QualityGateWithConditions[]> {
    return this.prismaService.qualityGate.findMany({
      orderBy: { id: 'asc' },
      include: { conditions: { orderBy: { id: 'asc' } } },
    });
  }
}
