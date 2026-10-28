import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <T extends Type>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        type: 'object',
        required: ['items', 'total'],
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(model) } },
          total: { type: 'number' },
        },
      },
    }),
  );
