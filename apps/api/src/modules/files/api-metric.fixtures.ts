export interface ApiRequestFixture {
  durationMs: number;
  method?: string;
  route?: string;
  statusCode?: number;
}

export const apiRequestLine = ({
  durationMs,
  method = 'GET',
  route = '/api/products',
  statusCode = 200,
}: ApiRequestFixture): string =>
  JSON.stringify({ ts: 1793174400000, method, route, status: statusCode, ms: durationMs });
