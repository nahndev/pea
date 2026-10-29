import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AddOnHeader, ErrorCode } from '@tomato/constants';
import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';
import { AddOnsModule } from '../add-ons.module';

const slowLine = JSON.stringify({
  context: {
    request: { url: '/api/activite_equipement/gets', method: 'GET' },
    responseTime: 1793216775.601549,
    elapsedMilleSecond: 7257,
  },
});

describe('LeaneoSlowApiConvertController', () => {
  let app: INestApplication;
  let url: string;

  const post = (form: FormData) => fetch(`${url}/add-ons/leaneo-slow-api-convert`, { method: 'POST', body: form });
  const formWith = (content: string) => {
    const form = new FormData();
    form.set('file', new Blob([content]), 'slow_api.log');
    return form;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AddOnsModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.listen(0);
    url = await app.getUrl();
  });

  afterAll(() => app.close());

  it('returns the converted file as an attachment with the counts in headers', async () => {
    const response = await post(formWith(`${slowLine}\nnot json\n`));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/x-ndjson');
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="api_metric.log"');
    expect(response.headers.get(AddOnHeader.CONVERTED_COUNT)).toBe('1');
    expect(response.headers.get(AddOnHeader.SKIPPED_COUNT)).toBe('1');
    expect(await response.text()).toContain('http.server.request.duration');
  });

  it('responds LOG_FILE_REQUIRED without a file', async () => {
    const response = await post(new FormData());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: ErrorCode.LOG_FILE_REQUIRED } });
  });

  it('responds LOG_FILE_INVALID when nothing can be converted', async () => {
    const response = await post(formWith('not json'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: ErrorCode.LOG_FILE_INVALID } });
  });
});
