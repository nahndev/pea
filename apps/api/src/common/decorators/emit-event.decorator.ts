import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

const EMITTER_PROPERTY = 'eventEmitter2';

interface EmitEventOptions {
  /** Emits once per item of the returned array */
  each?: boolean;
}

export function EmitEvent(event: string, { each = false }: EmitEventOptions = {}) {
  return <T extends (...args: never[]) => Promise<unknown>>(
    target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) => {
    Inject(EventEmitter2)(target, EMITTER_PROPERTY);

    const method = descriptor.value as unknown as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = async function (this: Record<string, EventEmitter2>, ...args: unknown[]) {
      const result = await method.apply(this, args);
      const payloads = each && Array.isArray(result) ? result : [result];
      for (const payload of payloads) this[EMITTER_PROPERTY].emit(event, payload);
      return result;
    } as unknown as T;
  };
}
