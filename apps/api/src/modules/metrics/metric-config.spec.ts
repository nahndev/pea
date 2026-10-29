import { SubjectType } from '@tomato/constants';
import { filterBySubject, mergeMetricConfig, parseMetricConfig } from './metric-config';
import { createMetricSubject } from './metric-subject';

describe('parseMetricConfig', () => {
  it('reads include and exclude, defaulting to empty lists', () => {
    expect(parseMetricConfig({})).toEqual({ include: [], exclude: [] });
    expect(parseMetricConfig(null)).toEqual({ include: [], exclude: [] });
    expect(parseMetricConfig({ include: ['a'], exclude: ['b'] })).toEqual({ include: ['a'], exclude: ['b'] });
  });

  it('ignores values that are not a list of strings', () => {
    expect(parseMetricConfig({ include: 'a', exclude: ['b', 1, null] })).toEqual({ include: [], exclude: ['b'] });
  });
});

describe('mergeMetricConfig', () => {
  it('replaces only the given lists and keeps other keys', () => {
    expect(mergeMetricConfig({ other: 1, include: ['a'], exclude: ['b'] }, { include: ['c'] })).toEqual({
      other: 1,
      include: ['c'],
      exclude: ['b'],
    });
    expect(mergeMetricConfig({}, { include: undefined, exclude: ['x'] })).toEqual({ include: [], exclude: ['x'] });
  });
});

describe('filterBySubject', () => {
  const cart = createMetricSubject(SubjectType.API, 'GET /api/cart');
  const health = createMetricSubject(SubjectType.API, 'GET /api/health');
  const orders = createMetricSubject(SubjectType.API, 'GET /api/orders');
  const measurements = [cart, health, orders].map((subject, index) => ({ subject, value: index }));
  const uuids = (items: typeof measurements) => items.map(({ subject }) => subject.description);

  it('keeps every subject when include and exclude are empty', () => {
    expect(filterBySubject(measurements, { include: [], exclude: [] })).toEqual(measurements);
  });

  it('keeps only the included subjects', () => {
    const result = filterBySubject(measurements, { include: [cart.uuid, orders.uuid], exclude: [] });
    expect(uuids(result as typeof measurements)).toEqual(['GET /api/cart', 'GET /api/orders']);
  });

  it('drops the excluded subjects', () => {
    const result = filterBySubject(measurements, { include: [], exclude: [health.uuid] });
    expect(uuids(result as typeof measurements)).toEqual(['GET /api/cart', 'GET /api/orders']);
  });

  it('applies exclude on top of include', () => {
    const result = filterBySubject(measurements, { include: [cart.uuid, health.uuid], exclude: [health.uuid] });
    expect(uuids(result as typeof measurements)).toEqual(['GET /api/cart']);
  });

  it('never filters a measurement without a subject', () => {
    const whole = [{ value: 1 }];
    expect(filterBySubject(whole, { include: [cart.uuid], exclude: [] })).toEqual(whole);
  });
});
