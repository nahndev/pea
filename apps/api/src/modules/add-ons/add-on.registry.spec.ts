import { BadRequestException } from '@nestjs/common';
import { AnalysisSchema, ErrorCode } from '@tomato/constants';
import { AddOnRegistry } from './add-on.registry';
import type { AddOnPlugin } from './add-ons.types';

const plugin = (id: string, overrides: Partial<AddOnPlugin> = {}): AddOnPlugin => ({
  manifest: {
    id,
    version: '1.0.0',
    label: id,
    description: '',
    converters: [{ id: 'api', schemas: [AnalysisSchema.API], input: 'a.log', hint: '' }],
  },
  converters: { api: () => ({}) },
  ...overrides,
});

describe('AddOnRegistry', () => {
  let registry: AddOnRegistry;

  beforeEach(() => {
    registry = new AddOnRegistry();
  });

  it('discovers the plugins folder', () => {
    expect(registry.list().map(({ id }) => id)).toContain('leaneo');
  });

  it('returns the converter of an add-on for a schema', () => {
    const converter = () => ({ ok: true });
    registry.register(plugin('acme', { converters: { api: converter } }));

    expect(registry.converterFor('acme', AnalysisSchema.API)).toBe(converter);
  });

  it.each([
    ['an unknown add-on', 'nope', AnalysisSchema.API],
    ['a schema the add-on does not convert', 'acme', AnalysisSchema.BUG],
  ] as const)('throws ADD_ON_NOT_FOUND for %s', (_, id, schema) => {
    registry.register(plugin('acme'));
    expect.assertions(1);
    try {
      registry.converterFor(id, schema);
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.ADD_ON_NOT_FOUND });
    }
  });

  it('rejects an add-on registered twice, without an implementation or with two converters for one schema', () => {
    registry.register(plugin('acme'));
    expect(() => registry.register(plugin('acme'))).toThrow('registered twice');
    expect(() => registry.register(plugin('empty', { converters: {} }))).toThrow('does not implement');
    const twice = plugin('twice');
    twice.manifest.converters.push({ ...twice.manifest.converters[0], id: 'other' });
    expect(() => registry.register(twice)).toThrow('several converters');
  });
});
