export const DEFAULT_DATABASE_PORT = 5432;
export const POSTGRES_URL_PATTERN = /^postgres(ql)?:\/\//;

export const DATABASE_FIELD_ERRORS: Record<string, string> = {
  required: 'This field is required.',
  too_long: 'Must be at most 255 characters.',
  invalid: 'This value is not valid.',
  invalid_port: 'Enter a port between 1 and 65535.',
  invalid_connection_string: 'Enter a postgres:// or postgresql:// connection string.',
};
