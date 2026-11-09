import { join } from 'node:path';

/** Each sub-folder is an add-on whose `index` default-exports an `AddOnPlugin` */
export const PLUGINS_DIR = join(__dirname, 'plugins');
