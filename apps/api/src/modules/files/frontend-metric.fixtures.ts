export interface PageLoadFixture {
  durationMs: number;
  route?: string;
  previousRoute?: string;
  status?: string;
  visibleMs?: number;
  requestCount?: number;
  longFrameMs?: number;
}

export const pageLoadLine = ({
  durationMs,
  route = '/synthese/:id?',
  previousRoute,
  status = 'settled',
  visibleMs = durationMs / 2,
  requestCount = 10,
  longFrameMs = 0,
}: PageLoadFixture): string =>
  JSON.stringify({
    '@timestamp': '2026-11-16T03:09:36.343Z',
    name: 'page-load',
    source: 'route',
    route,
    previousRoute,
    status,
    duration: durationMs,
    visibleDuration: visibleMs,
    requestCount,
    longFrameDuration: longFrameMs,
  });

/** Page subject of a fixture load */
export const pageOf = (route: string, previousRoute?: string): string =>
  `[page-load][route] ${route}${previousRoute ? ` - from ${previousRoute}` : ''}`;
