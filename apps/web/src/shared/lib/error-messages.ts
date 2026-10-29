import { ErrorCode } from '@tomato/constants';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.BAD_REQUEST]: 'The request is invalid.',
  [ErrorCode.UNAUTHORIZED]: 'You need to sign in to continue.',
  [ErrorCode.FORBIDDEN]: 'You do not have access to this resource.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.CONFLICT]: 'The request conflicts with the current state.',
  [ErrorCode.PAYLOAD_TOO_LARGE]: 'The payload is too large.',
  [ErrorCode.UNPROCESSABLE_ENTITY]: 'The request could not be processed.',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Something went wrong. Please try again.',
  [ErrorCode.ANALYSIS_NOT_FOUND]: 'This analysis does not exist.',
  [ErrorCode.BRANCH_NOT_FOUND]: 'This branch does not exist.',
  [ErrorCode.BRANCH_ALREADY_EXISTS]: 'A branch with this name already exists.',
  [ErrorCode.METRIC_NOT_FOUND]: 'This metric does not exist.',
  [ErrorCode.METRIC_CONDITION_NOT_FOUND]: 'This condition does not exist.',
  [ErrorCode.METRIC_CONDITION_ALREADY_EXISTS]: 'This quality gate already has a condition on this metric.',
  [ErrorCode.QUALITY_GATE_NOT_FOUND]: 'This quality gate does not exist.',
  [ErrorCode.RULE_NOT_FOUND]: 'This rule does not exist.',
  [ErrorCode.RULE_CONFIG_INVALID]: 'This setting is not valid for the rule.',
  [ErrorCode.RULE_ALREADY_EXISTS]: 'A rule of this type with this title already exists.',
  [ErrorCode.RULE_TYPE_UNSUPPORTED]: 'This rule type is not supported.',
  [ErrorCode.METRIC_TYPE_UNSUPPORTED]: 'This metric type is not supported.',
  [ErrorCode.LOG_FILE_REQUIRED]: 'A log file is required.',
  [ErrorCode.LOG_FILE_INVALID]: 'The log file is invalid.',
  [ErrorCode.LOG_FILE_DUPLICATED]: 'The log file was already uploaded.',
};

export const getErrorMessage = (code: ErrorCode) => ERROR_MESSAGES[code];
