import { AnalysisSchema, MetricType, SubjectType } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Metric } from '../../../../generated/client';
import type { ApiAnalysisContext } from '../../../analyses/analyses.types';
import { type PageLoadFixture, pageLoadLine } from '../../../files/frontend-metric.fixtures';
import { createSubject } from '../../../subjects/subject';
import { PagePercentileHandler } from './page-percentile.handler';

describe('PagePercentileHandler', () => {
  let dir: string;
  let pagePercentileHandler: PagePercentileHandler;

  const metric = (type: string = MetricType.PAGE_P95) => ({ id: 'm-1', type, description: '', config: {} }) as Metric;
  const context = (schema: ApiAnalysisContext['schema'] = AnalysisSchema.FRONTEND): ApiAnalysisContext => ({
    schema,
    logPath: join(dir, 'frontend_metric.log'),
  });

  const writeLog = (loads: PageLoadFixture[]) => writeFile(join(dir, 'frontend_metric.log'), loads.map(pageLoadLine).join('\n'));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'page-percentile-'));
    pagePercentileHandler = new PagePercentileHandler();
  });

  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('returns one measurement per page, slowest first, without aborted loads', async () => {
    await writeLog([
      { durationMs: 1000, route: '/groupe' },
      { durationMs: 2000, route: '/groupe' },
      { durationMs: 9000, route: '/synthese/:id?' },
      { durationMs: 10000, route: '/synthese/:id?' },
      { durationMs: 90000, route: '/synthese/:id?', status: 'aborted' },
      { durationMs: 500, route: '/tableau/:id', status: 'aborted' },
    ]);

    const measurements = await pagePercentileHandler.handle(metric(), context());

    expect(measurements.map(({ subject }) => subject?.description)).toEqual(['/synthese/:id?', '/groupe']);
    expect(measurements[0].subject).toEqual(createSubject(SubjectType.PAGE, '/synthese/:id?'));
    expect(measurements[0].value).toBeCloseTo(9950);
    expect(measurements[1].value).toBeCloseTo(1950);
  });

  it('measures nothing for another schema or metric type', async () => {
    await writeLog([{ durationMs: 1000 }]);

    await expect(pagePercentileHandler.handle(metric(), context(AnalysisSchema.API))).resolves.toEqual([]);
    await expect(pagePercentileHandler.handle(metric('UNKNOWN'), context())).resolves.toEqual([]);
  });
});
