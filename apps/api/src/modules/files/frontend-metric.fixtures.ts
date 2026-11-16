export interface PageLoadFixture {
  durationMs: number;
  route?: string;
  status?: string;
  visibleMs?: number;
  requestCount?: number;
  longFrameMs?: number;
}

export const pageLoadLine = ({
  durationMs,
  route = '/synthese/:id?',
  status = 'settled',
  visibleMs = durationMs / 2,
  requestCount = 10,
  longFrameMs = 0,
}: PageLoadFixture): string =>
  JSON.stringify({
    '@timestamp': '2026-11-16T03:09:36.343Z',
    name: 'page-load',
    route,
    status,
    duration: durationMs,
    visibleDuration: visibleMs,
    requestCount,
    longFrameDuration: longFrameMs,
  });
