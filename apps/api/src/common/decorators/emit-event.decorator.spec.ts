import { Injectable } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { EmitEvent } from './emit-event.decorator';

@Injectable()
class SampleService {
  @EmitEvent('sample.done')
  async run(fail = false): Promise<{ id: string }> {
    if (fail) throw new Error('boom');
    return { id: 'x-1' };
  }
}

describe('EmitEvent', () => {
  let sampleService: SampleService;
  let listener: jest.Mock;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [SampleService],
    }).compile();
    await module.init();
    sampleService = module.get(SampleService);
    listener = jest.fn();
    module.get(EventEmitter2).on('sample.done', listener);
  });

  it('emits the event with the returned value when the method finishes', async () => {
    await expect(sampleService.run()).resolves.toEqual({ id: 'x-1' });
    expect(listener).toHaveBeenCalledWith({ id: 'x-1' });
  });

  it('does not emit when the method throws', async () => {
    await expect(sampleService.run(true)).rejects.toThrow('boom');
    expect(listener).not.toHaveBeenCalled();
  });
});
