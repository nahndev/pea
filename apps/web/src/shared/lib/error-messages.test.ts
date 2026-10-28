import { describe, expect, it } from 'vitest';
import { ErrorCode } from '@tomato/constants';
import { ERROR_MESSAGES } from './error-messages';

describe('ERROR_MESSAGES', () => {
  it('defines a message for every error code', () => {
    for (const code of Object.values(ErrorCode)) expect(ERROR_MESSAGES[code]).toBeTruthy();
  });
});
