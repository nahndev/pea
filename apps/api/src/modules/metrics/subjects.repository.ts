import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { MetricSubject } from './metric-subject';

@Injectable()
export class SubjectsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(subjects: MetricSubject[]): Promise<number> {
    const { count } = await this.prismaService.subject.createMany({ data: subjects, skipDuplicates: true });
    return count;
  }
}
