import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseCheckStatus, DatabaseCheckType, DatabaseConnectionMode, type DatabaseSortField, ErrorCode } from '@tomato/constants';
import type { DatabaseInspection, DatabaseSummary, DatabaseView } from '@tomato/types';
import { type Database, Prisma } from '../../generated/client';
import { type Ordering, sortItems } from '../../common/sort/sort';
import { DEFAULT_DATABASE_PORT } from '../database-connections/database-connections.constants';
import { DatabaseConnectionsService } from '../database-connections/database-connections.service';
import type { DatabaseConnection, QueryStat, QueryStatsSnapshot, SubjectQueryStat } from '../database-connections/database-connections.types';
import { DatabasesRepository } from './databases.repository';
import type { DatabaseWithCount } from './databases.types';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { InspectDatabaseDto } from './dto/inspect-database.dto';
import { UpdateDatabaseDto } from './dto/update-database.dto';

const UNIQUE_VIOLATION_CODE = 'P2002';

type ConnectionInput = Omit<UpdateDatabaseDto, 'name'>;

const SORT_VALUE: Record<DatabaseSortField, (database: DatabaseView) => string | number> = {
  name: ({ name }) => name,
  address: ({ address }) => address,
  analysisCount: ({ analysisCount }) => analysisCount,
  updatedAt: ({ updatedAt }) => Date.parse(updatedAt),
};

@Injectable()
export class DatabasesService {
  constructor(
    private readonly databasesRepository: DatabasesRepository,
    private readonly databaseConnectionsService: DatabaseConnectionsService,
  ) {}

  async findAll(ordering: Ordering<DatabaseSortField> = []): Promise<DatabaseView[]> {
    const databases = await this.databasesRepository.findAll();
    return sortItems(databases.map((database) => this.toView(database)), SORT_VALUE, ordering);
  }

  async findOne(id: string): Promise<DatabaseView> {
    return this.toView(await this.findRecord(id));
  }

  async inspect({ name, ...input }: InspectDatabaseDto): Promise<DatabaseInspection> {
    const isNameTaken = await this.isNameTaken(name);
    const nameCheck = isNameTaken
      ? { type: DatabaseCheckType.NAME, status: DatabaseCheckStatus.FAILED, code: ErrorCode.DATABASE_ALREADY_EXISTS }
      : { type: DatabaseCheckType.NAME, status: DatabaseCheckStatus.PASSED };
    return { checks: [nameCheck, ...(await this.databaseConnectionsService.inspect(this.toConnection(input)!))] };
  }

  async create({ name, ...input }: CreateDatabaseDto): Promise<DatabaseView> {
    await this.assertNameAvailable(name);
    const connection = this.toConnection(input)!;
    await this.databaseConnectionsService.verify(connection);
    return this.toView(
      await this.save(() => this.databasesRepository.create({ name, connection: this.databaseConnectionsService.encrypt(connection) })),
    );
  }

  async update(id: string, { name, ...input }: UpdateDatabaseDto): Promise<DatabaseView> {
    const database = await this.findRecord(id);
    const connection = this.toConnection(input, this.databaseConnectionsService.decrypt(database.connection));
    if (name === undefined && !connection) return this.toView(database);
    if (name !== undefined) await this.assertNameAvailable(name, id);
    if (connection) await this.databaseConnectionsService.verify(connection);
    return this.toView(
      await this.save(() =>
        this.databasesRepository.update(id, {
          name,
          connection: connection && this.databaseConnectionsService.encrypt(connection),
        }),
      ),
    );
  }

  async remove(id: string): Promise<void> {
    const database = await this.findRecord(id);
    if (database._count.analyses) throw new ConflictException({ code: ErrorCode.DATABASE_IN_USE });
    await this.databasesRepository.delete(id);
  }

  async verify(id: string): Promise<void> {
    const database = await this.findRecord(id);
    await this.databaseConnectionsService.verify(this.databaseConnectionsService.decrypt(database.connection));
  }

  /** Saves the current per-query counters and returns the previous ones. */
  async swapQueryStats(databaseId: string, current: SubjectQueryStat[]): Promise<QueryStatsSnapshot | null> {
    const previous = await this.databasesRepository.findQueryStats(databaseId);
    const queries = Object.fromEntries(current.map(({ subject, calls, execMs }) => [subject.uuid, { calls, execMs }]));
    await this.databasesRepository.saveQueryStats(databaseId, { queries, takenAt: new Date() });
    return previous && { takenAt: previous.takenAt, queries: previous.queries as unknown as Record<string, QueryStat> };
  }

  toSummary({ id, name, connection }: Database): DatabaseSummary {
    return { id, name, address: this.databaseConnectionsService.describe(this.databaseConnectionsService.decrypt(connection)) };
  }

  private async findRecord(id: string): Promise<DatabaseWithCount> {
    const database = await this.databasesRepository.findById(id);
    if (!database) throw new NotFoundException({ code: ErrorCode.DATABASE_NOT_FOUND });
    return database;
  }

  private async isNameTaken(name: string, exceptId?: string): Promise<boolean> {
    const database = await this.databasesRepository.findByName(name);
    return Boolean(database && database.id !== exceptId);
  }

  /** Before connecting; the unique violation in `save` still covers races. */
  private async assertNameAvailable(name: string, exceptId?: string): Promise<void> {
    if (await this.isNameTaken(name, exceptId)) throw new ConflictException({ code: ErrorCode.DATABASE_ALREADY_EXISTS });
  }

  private async save(write: () => Promise<DatabaseWithCount>): Promise<DatabaseWithCount> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException({ code: ErrorCode.DATABASE_ALREADY_EXISTS });
      }
      throw error;
    }
  }

  private toConnection(
    { connectionString, host, port, database, user, password }: ConnectionInput,
    current?: DatabaseConnection,
  ): DatabaseConnection | undefined {
    if (connectionString) return { connectionString };
    if (host === undefined) return undefined;
    const isSameServer = current && 'host' in current && current.host === host && current.user === user;
    return {
      host,
      port: port ?? DEFAULT_DATABASE_PORT,
      database: database!,
      user: user!,
      password: password ?? (isSameServer ? current.password : undefined),
    };
  }

  private toView(record: DatabaseWithCount): DatabaseView {
    const connection = this.databaseConnectionsService.decrypt(record.connection);
    return {
      ...this.toSummary(record),
      connection:
        'connectionString' in connection
          ? { mode: DatabaseConnectionMode.URL }
          : { mode: DatabaseConnectionMode.FIELDS, host: connection.host, port: connection.port, database: connection.database, user: connection.user },
      analysisCount: record._count.analyses,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
