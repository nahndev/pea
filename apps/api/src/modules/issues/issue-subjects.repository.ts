import { Injectable } from '@nestjs/common';
import type { IssueSubject } from '../../generated/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface IssueSubjectKey {
  ruleId: string;
  subjectUuid: string;
}

@Injectable()
export class IssueSubjectsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMany(keys: IssueSubjectKey[]): Promise<number> {
    const { count } = await this.prismaService.issueSubject.createMany({ data: keys, skipDuplicates: true });
    return count;
  }

  findById(id: string): Promise<IssueSubject | null> {
    return this.prismaService.issueSubject.findUnique({ where: { id } });
  }

  update(id: string, data: { status: string }): Promise<IssueSubject> {
    return this.prismaService.issueSubject.update({ where: { id }, data });
  }
}
