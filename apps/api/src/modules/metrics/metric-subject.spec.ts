import { SubjectType } from '@tomato/constants';
import { createMetricSubject } from './metric-subject';

describe('createMetricSubject', () => {
  it('derives a stable uuid-v5 from the type and description', () => {
    expect(createMetricSubject(SubjectType.API, 'GET /api/cart')).toEqual({
      type: SubjectType.API,
      uuid: '1774ce23-c32c-58aa-9b40-bd08fcfdb938',
      description: 'GET /api/cart',
    });
  });

  it('gives different uuids to different descriptions and types', () => {
    const api = createMetricSubject(SubjectType.API, 'users');
    expect(createMetricSubject(SubjectType.API, 'orders').uuid).not.toBe(api.uuid);
    expect(createMetricSubject(SubjectType.QUERY, 'users').uuid).not.toBe(api.uuid);
  });
});
