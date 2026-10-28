import { Injectable } from '@nestjs/common';
import type { Branch } from '../../generated/client';
import { BranchesRepository } from './branches.repository';

@Injectable()
export class BranchesService {
  constructor(private readonly branchesRepository: BranchesRepository) {}

  findOrCreateByName(name: string): Promise<Branch> {
    return this.branchesRepository.upsertByName(name);
  }
}
