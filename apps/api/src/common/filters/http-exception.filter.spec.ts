import { ArgumentsHost, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import { HttpExceptionFilter } from './http-exception.filter';

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  new HttpExceptionFilter().catch(exception, host);
  return { status, json };
}

describe('HttpExceptionFilter', () => {
  it('uses the domain code and details of the exception', () => {
    const { status, json } = run(
      new BadRequestException({ code: ErrorCode.BAD_REQUEST, details: { branch: ['isString'] } }),
    );
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: { code: ErrorCode.BAD_REQUEST, details: { branch: ['isString'] } },
    });
  });

  it('derives the code from the status when none is given', () => {
    const { json } = run(new NotFoundException());
    expect(json).toHaveBeenCalledWith({ error: { code: ErrorCode.NOT_FOUND } });
  });

  it('ignores unknown codes', () => {
    const { json } = run(new NotFoundException({ code: 'whatever' }));
    expect(json).toHaveBeenCalledWith({ error: { code: ErrorCode.NOT_FOUND } });
  });

  it('hides unexpected errors behind INTERNAL_SERVER_ERROR', () => {
    const { status, json } = run(new Error('boom'));
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: { code: ErrorCode.INTERNAL_SERVER_ERROR } });
  });
});
