import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bugLogEvents } from '../../files/bug-log-events';
import { queryRows } from '../../files/duckdb-query';
import { LeaneoExceptionsConvertService } from './leaneo-exceptions-convert.service';

const DATETIME = '2026-11-02T20:17:09.844689+00:00';

const entry = (message: string, context: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) =>
  JSON.stringify({ message, context, level: 400, level_name: 'ERROR', channel: 'request', datetime: DATETIME, extra: {}, ...overrides });

const uncaught = (className: string, message: string, file: string, trace: string[] = [], code = 0) =>
  entry(`Uncaught PHP Exception ${className}: "${message}" at ${file}`, { exception: { class: className, message, code, file, trace } });

const file = (lines: string[]) => ({ buffer: Buffer.from(lines.join('\n')) }) as Express.Multer.File;

const lineOf = (content: string, index = 0) => JSON.parse(content.trim().split('\n')[index]);

describe('LeaneoExceptionsConvertService', () => {
  const service = new LeaneoExceptionsConvertService();

  it('converts an uncaught exception to a bug_log line', () => {
    const { content, converted, skipped } = service.convert(
      file([
        uncaught(
          'Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException',
          'Not Found',
          '/srv/websites/leaneo/vendor/symfony/framework-bundle/Controller/AbstractController.php:331',
          ['/srv/websites/leaneo/src/Controller/Shared/Tenant/TenantAuthPageController.php:29', '/srv/websites/leaneo/vendor/symfony/http-kernel/HttpKernel.php:183'],
        ),
      ]),
    );

    expect({ converted, skipped }).toEqual({ converted: 1, skipped: 0 });
    expect(lineOf(content)).toEqual({
      '@timestamp': '2026-11-02T20:17:09.844Z',
      'log.level': 'error',
      message: 'Uncaught PHP Exception Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException: "Not Found" at /srv/websites/leaneo/vendor/symfony/framework-bundle/Controller/AbstractController.php:{n}',
      'http.response.status_code': 404,
      'error.type': 'NotFoundHttpException',
      'error.message': 'Not Found',
      'error.stack_trace': [
        'vendor/symfony/framework-bundle/Controller/AbstractController.php:331',
        'src/Controller/Shared/Tenant/TenantAuthPageController.php:29',
        'vendor/symfony/http-kernel/HttpKernel.php:183',
      ].join('\n'),
    });
  });

  it('reads the endpoint of a missing route and of an API exception', () => {
    const { content } = service.convert(
      file([
        uncaught(
          'Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException',
          'No route found for "GET https://www.leaneo.com/api/system/fileView/12"',
          '/srv/websites/leaneo/vendor/symfony/http-kernel/EventListener/RouterListener.php:127',
        ),
        entry('API exception', { api: '/api/v2/conversation?processId=87633', IP: ['172.68.229.98'], email: null }, { level_name: 'CRITICAL' }),
      ]),
    );

    expect(lineOf(content, 0)).toMatchObject({
      'http.request.method': 'GET',
      'url.path': '/api/system/fileView/{id}',
      'http.response.status_code': 404,
    });
    expect(lineOf(content, 1)).toEqual({
      '@timestamp': '2026-11-02T20:17:09.844Z',
      'log.level': 'critical',
      message: 'API exception',
      'url.path': '/api/v2/conversation',
    });
  });

  it.each([
    ['an HTTP exception', 'Symfony\\Component\\HttpKernel\\Exception\\TooManyRequestsHttpException', 0, 429],
    ['any other uncaught exception', 'Doctrine\\DBAL\\Exception\\DeadlockException', 7, 500],
    ['an uncaught client exception', 'Symfony\\Component\\HttpClient\\Exception\\ClientException', 403, 500],
  ])('derives the status of %s', (_, className, code, status) => {
    const { content } = service.convert(file([uncaught(className, 'x', '/srv/websites/leaneo/src/A.php:1', [], code)]));
    expect(lineOf(content)['http.response.status_code']).toBe(status);
  });

  it('keeps an HTTP code of a handled exception and no status otherwise', () => {
    const handled = (code: number) =>
      entry('Connexion refusée', { exception: { class: 'App\\Models\\Exception\\Auth\\ValidationCompanyException', message: 'Connexion refusée', code } });
    const { content } = service.convert(file([handled(403), handled(1129)]));
    expect([0, 1].map((index) => lineOf(content, index)['http.response.status_code'])).toEqual([403, undefined]);
  });

  it('normalises the message of a log without exception, without ids, emails, ips or numbers', () => {
    const { content } = service.convert(
      file([
        entry('[0a553adb-b537-4a14-b40a-8b158f5b9887][someone@example.com] forced_logout_4', { event: 'forced_logout_4', batch: [] }),
        entry('[06 87 62 60 07] SMS sending blocked by guarder: Invalid SMS request'),
        entry('FIREBASE - Execution time0.0081970691680908'),
        entry('Too many requests from 104.23.168.78 for user 0a553adb-b537-4a14-b40a-8b158f5b9887 (someone@example.com) 1793700546'),
      ]),
    );

    expect([0, 1, 2, 3].map((index) => lineOf(content, index))).toEqual([
      { '@timestamp': '2026-11-02T20:17:09.844Z', 'log.level': 'error', message: 'forced_logout_4' },
      expect.objectContaining({ message: 'SMS sending blocked by guarder: Invalid SMS request' }),
      expect.objectContaining({ message: 'FIREBASE - Execution time{n}' }),
      expect.objectContaining({ message: 'Too many requests from {ip} for user {id} ({email}) {n}' }),
    ]);
  });

  it('does not leak the request, the user or ip addresses', () => {
    const { content } = service.convert(
      file([
        entry('Captcha debug', { request: { name: 'Someone', email: 'someone@example.com', phoneNumber: '284433118494' }, query: [] }),
        entry('API exception', { api: '/contact-email-sent', IP: ['172.68.229.98'], email: 'someone@example.com', body: 'secret' }),
        uncaught('Exception', 'Too many concurrent requests for ip: 104.23.168.78', '/srv/websites/leaneo/src/Handler/A.php:1'),
      ]),
    );

    for (const leak of ['someone@example.com', 'Someone', '284433118494', '172.68.229.98', '104.23.168.78', 'secret'])
      expect(content).not.toContain(leak);
  });

  it('skips blank, malformed and untyped lines and counts them', () => {
    const { content, converted, skipped } = service.convert(
      file([entry('API exception'), '', 'not json', '42', JSON.stringify({ context: {} }), entry('  '), entry('[only an id]')]),
    );
    expect({ converted, skipped }).toEqual({ converted: 1, skipped: 5 });
    expect(content.trim().split('\n')).toHaveLength(1);
  });

  it('accepts windows line endings and ends the output with a newline', () => {
    const { content, converted } = service.convert({ buffer: Buffer.from(`${entry('a')}\r\n${entry('b')}\r\n`) } as Express.Multer.File);
    expect(converted).toBe(2);
    expect(content.endsWith('\n')).toBe(true);
  });

  it('throws LOG_FILE_REQUIRED without a file', () => {
    expect.assertions(1);
    try {
      service.convert(undefined);
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.LOG_FILE_REQUIRED });
    }
  });

  it('throws LOG_FILE_INVALID when no line can be converted', () => {
    expect.assertions(1);
    try {
      service.convert(file(['not json', '']));
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toEqual({ code: ErrorCode.LOG_FILE_INVALID });
    }
  });

  describe('analysis reader', () => {
    let dir: string;
    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), 'exceptions-'));
    });
    afterEach(() => rm(dir, { recursive: true, force: true }));

    it('reads the converted file as bug_log events', async () => {
      const { content } = service.convert(
        file([
          uncaught('Doctrine\\DBAL\\Exception\\DeadlockException', 'Deadlock', '/srv/websites/leaneo/src/Repository/A.php:9'),
          entry('API exception', { api: '/favicon.ico' }, { level_name: 'CRITICAL' }),
        ]),
      );
      const path = join(dir, 'bug_log.log');
      await writeFile(path, content);

      const events = await queryRows(`SELECT error_group, is_critical, endpoint, status FROM ${bugLogEvents(path)} ORDER BY error_group`);

      expect(events).toEqual([
        { error_group: 'API exception', is_critical: true, endpoint: '/favicon.ico', status: null },
        { error_group: 'DeadlockException at src/Repository/A.php:9', is_critical: false, endpoint: null, status: 500 },
      ]);
    });
  });
});
