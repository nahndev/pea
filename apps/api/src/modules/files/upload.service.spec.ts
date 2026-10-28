import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { UploadService } from './upload.service';

const multerFile = (originalname: string, content = 'x') =>
  ({ originalname, buffer: Buffer.from(content) }) as Express.Multer.File;

describe('UploadService', () => {
  let dir: string;
  let service: UploadService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pea-uploads-'));
    service = new UploadService({ get: () => dir } as unknown as ConfigService<never, true>);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('saves each file and returns its name with the stored path', async () => {
    const [sql] = await service.save([multerFile('sql.log', 'select 1')]);

    expect(sql.file).toBe('sql.log');
    await expect(readFile(service.resolve(sql.path), 'utf8')).resolves.toBe('select 1');
  });

  it('never uses the uploaded name as the stored path', async () => {
    const [evil] = await service.save([multerFile('../evil.log')]);
    expect(evil.path).not.toContain('evil');
    await expect(stat(join(dir, '..', 'evil.log'))).rejects.toThrow();
  });

  it('removes the stored files', async () => {
    const files = await service.save([multerFile('sql.log'), multerFile('api_metric.log')]);
    await service.remove(files);
    await expect(stat(service.resolve(files[0].path))).rejects.toThrow();
    await expect(stat(service.resolve(files[1].path))).rejects.toThrow();
  });

  it('does not fail when removing a missing file', async () => {
    await expect(service.remove([{ path: 'missing' }])).resolves.toBeUndefined();
  });
});
