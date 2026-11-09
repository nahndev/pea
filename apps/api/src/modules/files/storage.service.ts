import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { ErrorCode } from '@tomato/constants';
import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface StoredFile {
  file: string;
  path: string;
}

@Injectable()
export class StorageService {
  private readonly rootDir: string;

  constructor(configService: ConfigService<Env, true>) {
    this.rootDir = resolve(configService.get('UPLOAD_DIR', { infer: true }));
  }

  /** Stores an upload kept in memory or on disk */
  save({ originalname, buffer, path }: Express.Multer.File): Promise<StoredFile> {
    return this.write(originalname, (target) => (path ? copyFile(path, target) : writeFile(target, buffer)));
  }

  saveStream(file: string, source: Readable): Promise<StoredFile> {
    return this.write(file, (target) => pipeline(source, createWriteStream(target)));
  }

  /** Reads an upload kept in memory or on disk */
  open({ buffer, path }: Express.Multer.File): Readable {
    return path ? createReadStream(path) : Readable.from([buffer]);
  }

  private async write(file: string, writeTo: (target: string) => Promise<void>): Promise<StoredFile> {
    await mkdir(this.rootDir, { recursive: true });
    const path = randomUUID();
    try {
      await writeTo(this.resolve(path));
    } catch (error) {
      await this.remove([{ path }]).catch(() => undefined);
      throw error;
    }
    return { file, path };
  }

  async saveMany(files: Express.Multer.File[]): Promise<StoredFile[]> {
    const results = await Promise.allSettled(files.map((file) => this.save(file)));
    const storedFiles = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    if (failure) {
      await this.remove(storedFiles).catch(() => undefined);
      throw failure.reason;
    }
    return storedFiles;
  }

  resolve(path: string | null): string {
    if (path === null) throw new UnprocessableEntityException({ code: ErrorCode.LOG_FILE_REQUIRED });
    return join(this.rootDir, path);
  }

  async remove(files: Pick<StoredFile, 'path'>[]): Promise<void> {
    await Promise.all(files.map(({ path }) => rm(this.resolve(path), { force: true })));
  }
}
