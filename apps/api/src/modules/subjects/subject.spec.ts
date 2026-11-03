import { SubjectType } from '@tomato/constants';
import { createSubject, DEFAULT_SUBJECT } from './subject';

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

describe('DEFAULT_SUBJECT', () => {
  it('keeps the uuid seeded by the add_default_subject migration', () => {
    expect(DEFAULT_SUBJECT).toEqual({ type: SubjectType.DEFAULT, uuid: '0dd4c91b-3232-5445-a3e8-e8bcf153b4a9', description: 'All requests' });
  });
});
