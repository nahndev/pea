import type { Prisma } from '../../generated/client';
import type { MetricMeasurement } from './handlers/metric-handler.types';

export interface MetricConfig {
  include: string[];
  exclude: string[];
}

const asRecord = (config: Prisma.JsonValue): Prisma.JsonObject =>
  typeof config === 'object' && config !== null && !Array.isArray(config) ? config : {};

const asUuids = (value: Prisma.JsonValue | undefined): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export const parseMetricConfig = (config: Prisma.JsonValue): MetricConfig => {
  const { include, exclude } = asRecord(config);
  return { include: asUuids(include), exclude: asUuids(exclude) };
};

export const mergeMetricConfig = (
  config: Prisma.JsonValue,
  { include, exclude }: Partial<MetricConfig>,
): Prisma.InputJsonObject => {
  const current = parseMetricConfig(config);
  return { ...asRecord(config), include: include ?? current.include, exclude: exclude ?? current.exclude };
};

/** Measurements without a subject are never filtered. */
export const filterBySubject = (measurements: MetricMeasurement[], { include, exclude }: MetricConfig): MetricMeasurement[] =>
  measurements.filter(({ subject }) => {
    if (!subject) return true;
    if (include.length && !include.includes(subject.uuid)) return false;
    return !exclude.includes(subject.uuid);
  });
