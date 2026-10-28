import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { ErrorCode } from '@tomato/constants';
import type { ApiErrorDetails } from '@tomato/types';

function collectDetails(errors: ValidationError[], parent = '', details: ApiErrorDetails = {}) {
  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) details[field] = Object.keys(error.constraints);
    if (error.children?.length) collectDetails(error.children, field, details);
  }
  return details;
}

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({ code: ErrorCode.BAD_REQUEST, details: collectDetails(errors) }),
  });
}
