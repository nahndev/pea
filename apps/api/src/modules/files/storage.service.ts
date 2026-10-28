import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

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

  async save({ originalname, buffer }: Express.Multer.File): Promise<StoredFile> {
    await mkdir(this.rootDir, { recursive: true });
    const path = randomUUID();
    try {
      await writeFile(this.resolve(path), buffer);
    } catch (error) {
      await this.remove([{ path }]).catch(() => undefined);
      throw error;
    }
    return { file: originalname, path };
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

  resolve(path: string): string {
    return join(this.rootDir, path);
  }

  async remove(files: Pick<StoredFile, 'path'>[]): Promise<void> {
    await Promise.all(files.map(({ path }) => rm(this.resolve(path), { force: true })));
  }
}
