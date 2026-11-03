import { SubjectType } from '@tomato/constants';
import { createSubject } from './subject';

describe('createSubject', () => {
  it('derives a stable uuid-v5 from the type and description', () => {
    expect(createSubject(SubjectType.API, 'GET /api/cart')).toEqual({
      type: SubjectType.API,
      uuid: '1774ce23-c32c-58aa-9b40-bd08fcfdb938',
      description: 'GET /api/cart',
    });
  });

  it('gives different uuids to different descriptions and types', () => {
    const api = createSubject(SubjectType.API, 'users');
    expect(createSubject(SubjectType.API, 'orders').uuid).not.toBe(api.uuid);
    expect(createSubject(SubjectType.QUERY, 'users').uuid).not.toBe(api.uuid);
  });
});
