export const otlpApiMetricLine = (durationMs: number, name = 'http.server.request.duration'): string =>
  JSON.stringify({
    resourceMetrics: [
      {
        resource: { attributes: [{ key: 'service.name', value: { stringValue: 'leaneo' } }] },
        scopeMetrics: [
          {
            scope: { name: 'leaneo.api_metric' },
            metrics: [
              {
                name,
                unit: 's',
                histogram: {
                  aggregationTemporality: 1,
                  dataPoints: [{ count: '1', sum: durationMs / 1000 }],
                },
              },
            ],
          },
        ],
      },
    ],
  });

export interface ApiRequestFixture {
  durationMs: number;
  method?: string;
  route?: string;
  statusCode?: number;
}

export const otlpApiRequestLine = ({
  durationMs,
  method = 'GET',
  route = '/api/products',
  statusCode = 200,
}: ApiRequestFixture): string =>
  JSON.stringify({
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: 'http.server.request.duration',
                histogram: {
                  dataPoints: [
                    {
                      attributes: [
                        { key: 'http.request.method', value: { stringValue: method } },
                        { key: 'http.route', value: { stringValue: route } },
                        { key: 'http.response.status_code', value: { intValue: String(statusCode) } },
                      ],
                      sum: durationMs / 1000,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  });
