import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface UploadedFile {
  file: string;
  path: string;
}

@Injectable()
export class UploadService {
  private readonly rootDir: string;

  constructor(config: ConfigService<Env, true>) {
    this.rootDir = resolve(config.get('UPLOAD_DIR', { infer: true }));
  }

  async save(files: Express.Multer.File[]): Promise<UploadedFile[]> {
    await mkdir(this.rootDir, { recursive: true });
    const uploadedFiles = files.map(({ originalname }) => ({ file: originalname, path: randomUUID() }));
    try {
      await Promise.all(files.map(({ buffer }, index) => writeFile(this.resolve(uploadedFiles[index].path), buffer)));
    } catch (error) {
      await this.remove(uploadedFiles).catch(() => undefined);
      throw error;
    }
    return uploadedFiles;
  }

  resolve(path: string): string {
    return join(this.rootDir, path);
  }

  async remove(files: Pick<UploadedFile, 'path'>[]): Promise<void> {
    await Promise.all(files.map(({ path }) => rm(this.resolve(path), { force: true })));
  }
}
