export const USERNAME_MAX_LENGTH = 100;
export const USERNAME_PATTERN = /^[a-z0-9._-]+$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const USER_FIELD_ERRORS: Record<string, string> = {
  required: 'This field is required.',
  too_long: 'This value is too long.',
  invalid: 'This value is not valid.',
  invalid_username: 'Use lowercase letters, digits, dots, dashes or underscores.',
  password_too_short: `Must be at least ${PASSWORD_MIN_LENGTH} characters.`,
};
