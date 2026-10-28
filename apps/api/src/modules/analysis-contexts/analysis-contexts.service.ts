import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { Paginated } from '@tomato/types';
import type { AnalysisContext } from '../../generated/client';
import { AnalysisContextsRepository } from './analysis-contexts.repository';
import { ListAnalysisContextsQueryDto } from './dto/list-analysis-contexts-query.dto';

@Injectable()
export class AnalysisContextsService {
  constructor(private readonly repository: AnalysisContextsRepository) {}

  findAll({ limit, offset, ...filter }: ListAnalysisContextsQueryDto): Promise<
    Paginated<AnalysisContext>
  > {
    return this.repository.findMany(filter, limit, offset);
  }

  async findOne(id: string): Promise<AnalysisContext> {
    const context = await this.repository.findById(id);
    if (!context) throw new NotFoundException({ code: ErrorCode.ANALYSIS_CONTEXT_NOT_FOUND });
    return context;
  }
}
