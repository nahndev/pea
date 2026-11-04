export interface BugEventFixture {
  type?: string;
  level?: string;
  message?: string;
  location?: string;
  service?: string;
  method?: string;
  route?: string;
  status?: number;
}

export const bugEventLine = ({
  type = 'NotFoundHttpException',
  level = 'error',
  message = 'Not Found',
  location,
  service,
  method,
  route,
  status,
}: BugEventFixture = {}): string =>
  JSON.stringify({
    '@timestamp': '2026-11-01T00:00:00.000Z',
    'log.level': level,
    'service.name': service,
    'http.request.method': method,
    'url.path': route,
    'http.response.status_code': status,
    'error.type': type,
    'error.message': message,
    'error.stack_trace': location,
  });
