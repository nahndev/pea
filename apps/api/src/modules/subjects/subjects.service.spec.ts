import { SubjectType } from '@tomato/constants';
import { createSubject } from './subject';
import { SubjectsRepository } from './subjects.repository';
import { SubjectsService } from './subjects.service';

describe('SubjectsService', () => {
  let subjectsRepository: jest.Mocked<Pick<SubjectsRepository, 'createMany' | 'findByMetric'>>;
  let subjectsService: SubjectsService;

  const cart = createSubject(SubjectType.API, 'GET /api/cart');
  const orders = createSubject(SubjectType.API, 'GET /api/orders');

  beforeEach(() => {
    subjectsRepository = {
      createMany: jest.fn().mockImplementation((items: unknown[]) => items.length),
      findByMetric: jest.fn(),
    };
    subjectsService = new SubjectsService(subjectsRepository as unknown as SubjectsRepository);
  });

  it('saves each subject once', async () => {
    await expect(subjectsService.createMany([cart, orders, cart])).resolves.toBe(2);
    expect(subjectsRepository.createMany).toHaveBeenCalledWith([cart, orders]);
  });

  it('skips the database when there is nothing to create', async () => {
    await expect(subjectsService.createMany([])).resolves.toBe(0);
    expect(subjectsRepository.createMany).not.toHaveBeenCalled();
  });

  it('lists the subjects of a metric as views', async () => {
    subjectsRepository.findByMetric.mockResolvedValue([{ ...cart, createdAt: new Date() }]);

    await expect(subjectsService.findByMetric('m-1')).resolves.toEqual([cart]);
    expect(subjectsRepository.findByMetric).toHaveBeenCalledWith('m-1');
  });
});
