import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode, type UserSortField } from '@tomato/constants';
import type { UserView } from '@tomato/types';
import { Prisma } from '../../generated/client';
import { hashPassword } from '../../common/crypto/password';
import { type Ordering, sortItems } from '../../common/sort/sort';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import type { UserWithGroup } from './users.types';

const UNIQUE_VIOLATION_CODE = 'P2002';

const SORT_VALUE: Record<UserSortField, (user: UserView) => string | number> = {
  name: ({ name }) => name,
  username: ({ username }) => username,
  group: ({ group }) => group.name,
  createdAt: ({ createdAt }) => Date.parse(createdAt),
};

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly groupsService: GroupsService,
    private readonly authService: AuthService,
  ) {}

  async findAll(ordering: Ordering<UserSortField> = []): Promise<UserView[]> {
    const users = await this.usersRepository.findAll();
    return sortItems(users.map((user) => this.toView(user)), SORT_VALUE, ordering);
  }

  async findOne(id: string): Promise<UserView> {
    return this.toView(await this.findRecord(id));
  }

  async create({ password, ...dto }: CreateUserDto): Promise<UserView> {
    await this.groupsService.assertExists(dto.groupId);
    const passwordHash = await hashPassword(password);
    return this.toView(await this.save(() => this.usersRepository.create({ ...dto, passwordHash })));
  }

  async update(id: string, { password, ...dto }: UpdateUserDto): Promise<UserView> {
    await this.findRecord(id);
    if (dto.groupId) await this.groupsService.assertExists(dto.groupId);
    const passwordHash = password === undefined ? undefined : await hashPassword(password);
    const user = await this.save(() => this.usersRepository.update(id, { ...dto, passwordHash }));
    if (passwordHash) await this.authService.revokeUserSessions(id);
    return this.toView(user);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) throw new ConflictException({ code: ErrorCode.USER_SELF_DELETE });
    await this.findRecord(id);
    await this.usersRepository.delete(id);
  }

  private async findRecord(id: string): Promise<UserWithGroup> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException({ code: ErrorCode.USER_NOT_FOUND });
    return user;
  }

  private async save(write: () => Promise<UserWithGroup>): Promise<UserWithGroup> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException({ code: ErrorCode.USER_ALREADY_EXISTS });
      }
      throw error;
    }
  }

  private toView({ id, name, username, group, createdAt, updatedAt }: UserWithGroup): UserView {
    return { id, name, username, group, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
  }
}
