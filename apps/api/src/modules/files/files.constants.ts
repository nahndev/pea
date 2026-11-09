import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Multer writes uploads here; they are removed once the request ends */
export const UPLOAD_TMP_DIR = join(tmpdir(), 'pea-uploads');
