import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Subject } from '../../generated/client';
import type { MetricSubject } from './metric-subject';

@Injectable()
export class SubjectsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(subjects: MetricSubject[]): Promise<number> {
    const { count } = await this.prismaService.subject.createMany({ data: subjects, skipDuplicates: true });
    return count;
  }

  findByMetric(metricId: string): Promise<Subject[]> {
    return this.prismaService.subject.findMany({
      where: { results: { some: { metricId } } },
      orderBy: [{ description: 'asc' }, { uuid: 'asc' }],
    });
  }
}
