import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { Paginated } from '@tomato/types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { MergeRequest } from './entities/merge-request.entity';
import { MergeRequestsRepository } from './merge-requests.repository';

@Injectable()
export class MergeRequestsService {
  constructor(private readonly repository: MergeRequestsRepository) {}

  findAll({ limit, offset }: PaginationQueryDto): Promise<Paginated<MergeRequest>> {
    return this.repository.findMany(limit, offset);
  }

  async findOne(id: string): Promise<MergeRequest> {
    const mergeRequest = await this.repository.findById(id);
    if (!mergeRequest) throw new NotFoundException({ code: ErrorCode.MERGE_REQUEST_NOT_FOUND });
    return mergeRequest;
  }

  findOrCreateByIid(iid: number): Promise<MergeRequest> {
    return this.repository.upsertByIid(iid);
  }
}
