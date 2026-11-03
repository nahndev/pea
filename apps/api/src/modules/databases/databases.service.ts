import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseConnectionMode, ErrorCode } from '@tomato/constants';
import type { DatabaseSummary, DatabaseView } from '@tomato/types';
import { type Database, Prisma } from '../../generated/client';
import { DEFAULT_DATABASE_PORT } from '../database-connections/database-connections.constants';
import { DatabaseConnectionsService } from '../database-connections/database-connections.service';
import type { DatabaseConnection } from '../database-connections/database-connections.types';
import { DatabasesRepository } from './databases.repository';
import type { DatabaseWithCount } from './databases.types';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { UpdateDatabaseDto } from './dto/update-database.dto';

const UNIQUE_VIOLATION_CODE = 'P2002';

type ConnectionInput = Omit<UpdateDatabaseDto, 'name'>;

@Injectable()
export class DatabasesService {
  constructor(
    private readonly databasesRepository: DatabasesRepository,
    private readonly databaseConnectionsService: DatabaseConnectionsService,
  ) {}

  async findAll(): Promise<DatabaseView[]> {
    const databases = await this.databasesRepository.findAll();
    return databases.map((database) => this.toView(database));
  }

  async findOne(id: string): Promise<DatabaseView> {
    return this.toView(await this.findRecord(id));
  }

  async create({ name, ...input }: CreateDatabaseDto): Promise<DatabaseView> {
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

  toSummary({ id, name, connection }: Database): DatabaseSummary {
    return { id, name, address: this.databaseConnectionsService.describe(this.databaseConnectionsService.decrypt(connection)) };
  }

  private async findRecord(id: string): Promise<DatabaseWithCount> {
    const database = await this.databasesRepository.findById(id);
    if (!database) throw new NotFoundException({ code: ErrorCode.DATABASE_NOT_FOUND });
    return database;
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
