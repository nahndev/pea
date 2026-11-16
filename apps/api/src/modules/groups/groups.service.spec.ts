import { ConflictException, NotFoundException } from '@nestjs/common';
import { ErrorCode, GroupSortField, Permission, SortOrder } from '@tomato/constants';
import { Prisma } from '../../generated/client';
import { GroupsRepository } from './groups.repository';
import { GroupsService } from './groups.service';
import type { GroupWithUsers } from './groups.types';

describe('GroupsService', () => {
  const createdAt = new Date('2026-11-01T00:00:00.000Z');
  const record = (overrides: Partial<GroupWithUsers> = {}): GroupWithUsers => ({
    id: 'group-1',
    name: 'Analysts',
    permissions: [Permission.REPO_VIEW],
    createdAt,
    updatedAt: createdAt,
    users: [],
    ...overrides,
  });
  const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError('failed', { code, clientVersion: 'test' });
  const responseOf = async (promise: Promise<unknown>) => ((await promise.catch((e: Error) => e)) as ConflictException).getResponse();

  let groupsRepository: jest.Mocked<Pick<GroupsRepository, 'findAll' | 'findById' | 'exists' | 'create' | 'update' | 'delete'>>;
  let groupsService: GroupsService;

  beforeEach(() => {
    groupsRepository = {
      findAll: jest.fn(),
      findById: jest.fn().mockResolvedValue(record()),
      exists: jest.fn().mockResolvedValue(true),
      create: jest.fn(async (data) => record(data)),
      update: jest.fn(async (_id, data) => record(data)),
      delete: jest.fn(),
    };
    groupsService = new GroupsService(groupsRepository as unknown as GroupsRepository);
  });

  it('sorts groups by user count', async () => {
    groupsRepository.findAll.mockResolvedValue([
      record({ id: 'a', name: 'A', users: [] }),
      record({ id: 'b', name: 'B', users: [{ id: 'u', name: 'U', username: 'u' }] }),
    ]);

    const groups = await groupsService.findAll([{ field: GroupSortField.USER_COUNT, order: SortOrder.DESC }]);

    expect(groups.map(({ id }) => id)).toEqual(['b', 'a']);
  });

  it('maps a duplicated name to GROUP_ALREADY_EXISTS', async () => {
    groupsRepository.create.mockRejectedValue(prismaError('P2002'));

    await expect(responseOf(groupsService.create({ name: 'Analysts', permissions: [] }))).resolves.toEqual({ code: ErrorCode.GROUP_ALREADY_EXISTS });
  });

  it('refuses to delete a group with users', async () => {
    groupsRepository.findById.mockResolvedValue(record({ users: [{ id: 'u', name: 'U', username: 'u' }] }));

    await expect(responseOf(groupsService.remove('group-1'))).resolves.toEqual({ code: ErrorCode.GROUP_IN_USE });
    expect(groupsRepository.delete).not.toHaveBeenCalled();
  });

  it('maps a user added while deleting to GROUP_IN_USE', async () => {
    groupsRepository.delete.mockRejectedValue(prismaError('P2003'));

    await expect(responseOf(groupsService.remove('group-1'))).resolves.toEqual({ code: ErrorCode.GROUP_IN_USE });
  });

  it('throws GROUP_NOT_FOUND for a missing group', async () => {
    groupsRepository.exists.mockResolvedValue(false);

    await expect(groupsService.assertExists('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
