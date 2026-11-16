import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode, type GroupSortField } from '@tomato/constants';
import type { GroupView } from '@tomato/types';
import { Prisma } from '../../generated/client';
import { toPermissions } from '../../common/auth/permissions';
import { type Ordering, sortItems } from '../../common/sort/sort';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsRepository } from './groups.repository';
import type { GroupWithUsers } from './groups.types';

const UNIQUE_VIOLATION_CODE = 'P2002';
const FOREIGN_KEY_VIOLATION_CODE = 'P2003';

const SORT_VALUE: Record<GroupSortField, (group: GroupView) => string | number> = {
  name: ({ name }) => name,
  permissionCount: ({ permissions }) => permissions.length,
  userCount: ({ users }) => users.length,
};

const hasPrismaCode = (error: unknown, code: string) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

@Injectable()
export class GroupsService {
  constructor(private readonly groupsRepository: GroupsRepository) {}

  async findAll(ordering: Ordering<GroupSortField> = []): Promise<GroupView[]> {
    const groups = await this.groupsRepository.findAll();
    return sortItems(groups.map((group) => this.toView(group)), SORT_VALUE, ordering);
  }

  async findOne(id: string): Promise<GroupView> {
    return this.toView(await this.findRecord(id));
  }

  async assertExists(id: string): Promise<void> {
    if (!(await this.groupsRepository.exists(id))) throw new NotFoundException({ code: ErrorCode.GROUP_NOT_FOUND });
  }

  async create(dto: CreateGroupDto): Promise<GroupView> {
    return this.toView(await this.save(() => this.groupsRepository.create(dto)));
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupView> {
    await this.findRecord(id);
    return this.toView(await this.save(() => this.groupsRepository.update(id, dto)));
  }

  async remove(id: string): Promise<void> {
    const group = await this.findRecord(id);
    if (group.users.length) throw new ConflictException({ code: ErrorCode.GROUP_IN_USE });
    try {
      await this.groupsRepository.delete(id);
    } catch (error) {
      if (hasPrismaCode(error, FOREIGN_KEY_VIOLATION_CODE)) throw new ConflictException({ code: ErrorCode.GROUP_IN_USE });
      throw error;
    }
  }

  private async findRecord(id: string): Promise<GroupWithUsers> {
    const group = await this.groupsRepository.findById(id);
    if (!group) throw new NotFoundException({ code: ErrorCode.GROUP_NOT_FOUND });
    return group;
  }

  private async save(write: () => Promise<GroupWithUsers>): Promise<GroupWithUsers> {
    try {
      return await write();
    } catch (error) {
      if (hasPrismaCode(error, UNIQUE_VIOLATION_CODE)) throw new ConflictException({ code: ErrorCode.GROUP_ALREADY_EXISTS });
      throw error;
    }
  }

  private toView({ id, name, permissions, users, createdAt, updatedAt }: GroupWithUsers): GroupView {
    return { id, name, permissions: toPermissions(permissions), users, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
  }
}
