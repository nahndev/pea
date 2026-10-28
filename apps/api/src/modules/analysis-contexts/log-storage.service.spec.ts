import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LogStorageService } from './log-storage.service';

describe('LogStorageService', () => {
  let dir: string;
  let service: LogStorageService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pea-logs-'));
    service = new LogStorageService({ get: () => dir } as unknown as ConfigService<never, true>);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('saves files under the analysis folder', async () => {
    await service.save('an-1', [{ file: 'sql.log', buffer: Buffer.from('select 1') }]);
    await expect(readFile(join(dir, 'an-1', 'sql.log'), 'utf8')).resolves.toBe('select 1');
  });

  it('removes the analysis folder', async () => {
    await service.save('an-1', [{ file: 'sql.log', buffer: Buffer.from('x') }]);
    await service.remove('an-1');
    await expect(stat(join(dir, 'an-1'))).rejects.toThrow();
  });

  it('does not fail when removing a missing folder', async () => {
    await expect(service.remove('missing')).resolves.toBeUndefined();
  });
});
