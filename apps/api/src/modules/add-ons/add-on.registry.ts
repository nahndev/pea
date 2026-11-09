import { BadRequestException, Injectable } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { AddOnManifest } from '@tomato/types';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PLUGINS_DIR } from './add-ons.constants';
import type { AddOnPlugin, LineConverter, LogAnalysisSchema } from './add-ons.types';

const loadPlugins = (dir: string): AddOnPlugin[] =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    .map((entry) => (require(join(dir, entry.name)) as { default: AddOnPlugin }).default);

/** Add-ons found in `plugins/` at startup */
@Injectable()
export class AddOnRegistry {
  private readonly plugins = new Map<string, AddOnPlugin>();

  constructor() {
    loadPlugins(PLUGINS_DIR).forEach((plugin) => this.register(plugin));
  }

  register(plugin: AddOnPlugin): void {
    const { id, converters } = plugin.manifest;
    if (this.plugins.has(id)) throw new Error(`Add-on "${id}" is registered twice`);
    const schemas = converters.flatMap(({ schemas }) => schemas);
    if (new Set(schemas).size !== schemas.length) throw new Error(`Add-on "${id}" has several converters for one schema`);
    const missing = converters.find((converter) => !plugin.converters[converter.id]);
    if (missing) throw new Error(`Add-on "${id}" does not implement the converter "${missing.id}"`);
    this.plugins.set(id, plugin);
  }

  list(): AddOnManifest[] {
    return [...this.plugins.values()].map(({ manifest }) => manifest);
  }

  converterFor(addOnId: string, schema: LogAnalysisSchema): LineConverter {
    const plugin = this.plugins.get(addOnId);
    const converter = plugin?.manifest.converters.find(({ schemas }) => schemas.includes(schema));
    if (!plugin || !converter) throw new BadRequestException({ code: ErrorCode.ADD_ON_NOT_FOUND });
    return plugin.converters[converter.id];
  }
}
