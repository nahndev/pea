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
