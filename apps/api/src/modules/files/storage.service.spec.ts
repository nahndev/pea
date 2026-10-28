import { ConfigService } from '@nestjs/config';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StorageService } from './storage.service';

const multerFile = (originalname: string, content = 'x') =>
  ({ originalname, buffer: Buffer.from(content) }) as Express.Multer.File;

describe('StorageService', () => {
  let dir: string;
  let storageService: StorageService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pea-uploads-'));
    storageService = new StorageService({ get: () => dir } as unknown as ConfigService<never, true>);
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('saves the file and returns its name with the stored path', async () => {
    const stored = await storageService.save(multerFile('b.jsonl', 'select 1'));

    expect(stored.file).toBe('b.jsonl');
    await expect(readFile(storageService.resolve(stored.path), 'utf8')).resolves.toBe('select 1');
  });

  it('never uses the uploaded name as the stored path', async () => {
    const evil = await storageService.save(multerFile('../evil.log'));
    expect(evil.path).not.toContain('evil');
    await expect(stat(join(dir, '..', 'evil.log'))).rejects.toThrow();
  });

  it('saves many files', async () => {
    const stored = await storageService.saveMany([multerFile('a.jsonl', 'a'), multerFile('b.jsonl', 'b')]);

    expect(stored.map(({ file }) => file)).toEqual(['a.jsonl', 'b.jsonl']);
    await expect(readFile(storageService.resolve(stored[1].path), 'utf8')).resolves.toBe('b');
  });

  it('removes the files already stored when one of many fails', async () => {
    const original = storageService.save.bind(storageService);
    jest
      .spyOn(storageService, 'save')
      .mockImplementationOnce(original)
      .mockRejectedValueOnce(new Error('disk full'));

    await expect(storageService.saveMany([multerFile('a.jsonl'), multerFile('b.jsonl')])).rejects.toThrow('disk full');
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  it('removes the stored files', async () => {
    const files = [
      await storageService.save(multerFile('a.jsonl')),
      await storageService.save(multerFile('b.jsonl')),
    ];
    await storageService.remove(files);
    await expect(stat(storageService.resolve(files[0].path))).rejects.toThrow();
    await expect(stat(storageService.resolve(files[1].path))).rejects.toThrow();
  });

  it('does not fail when removing a missing file', async () => {
    await expect(storageService.remove([{ path: 'missing' }])).resolves.toBeUndefined();
  });
});
