import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lastValueFrom, of, throwError } from 'rxjs';
import { RemoveUploadsInterceptor } from './remove-uploads.interceptor';

describe('RemoveUploadsInterceptor', () => {
  let dir: string;
  const interceptor = new RemoveUploadsInterceptor();

  const contextOf = (request: object) => ({ switchToHttp: () => ({ getRequest: () => request }) }) as ExecutionContext;

  const upload = async (name: string) => {
    const path = join(dir, name);
    await writeFile(path, 'x');
    return { path } as Express.Multer.File;
  };

  const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pea-interceptor-'));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('removes the uploaded files after the handler succeeds', async () => {
    const request = { files: { api_metric: [await upload('a')], bug_log: [await upload('b')] } };

    await lastValueFrom(interceptor.intercept(contextOf(request), { handle: () => of('ok') } as CallHandler));
    await settle();

    await expect(readdir(dir)).resolves.toEqual([]);
  });

  it('removes the uploaded files after the handler fails', async () => {
    const request = { file: await upload('a') };
    const handler = { handle: () => throwError(() => new Error('boom')) } as CallHandler;

    await expect(lastValueFrom(interceptor.intercept(contextOf(request), handler))).rejects.toThrow('boom');
    await settle();

    await expect(readdir(dir)).resolves.toEqual([]);
  });
});
