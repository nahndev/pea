import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@tomato/config';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface LogFileContent {
  file: string;
  buffer: Buffer;
}

@Injectable()
export class LogStorageService {
  private readonly rootDir: string;

  constructor(config: ConfigService<Env, true>) {
    this.rootDir = resolve(config.get('UPLOAD_DIR', { infer: true }));
  }

  async save(analysisId: string, files: LogFileContent[]): Promise<void> {
    const dir = this.dirOf(analysisId);
    await mkdir(dir, { recursive: true });
    await Promise.all(files.map(({ file, buffer }) => writeFile(join(dir, file), buffer)));
  }

  remove(analysisId: string): Promise<void> {
    return rm(this.dirOf(analysisId), { recursive: true, force: true });
  }

  private dirOf(analysisId: string) {
    return join(this.rootDir, analysisId);
  }
}
