import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

const EMITTER_PROPERTY = 'eventEmitter2';

export function EmitEvent(event: string) {
  return <T extends (...args: never[]) => Promise<unknown>>(
    target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) => {
    Inject(EventEmitter2)(target, EMITTER_PROPERTY);

    const method = descriptor.value as unknown as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = async function (this: Record<string, EventEmitter2>, ...args: unknown[]) {
      const result = await method.apply(this, args);
      this[EMITTER_PROPERTY].emit(event, result);
      return result;
    } as unknown as T;
  };
}
