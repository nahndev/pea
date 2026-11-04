export interface BugEventFixture {
  type?: string;
  level?: string;
  message?: string;
  location?: string;
  method?: string;
  route?: string;
  status?: number;
}

export const bugEventLine = ({
  type = 'NotFoundHttpException',
  level = 'ERROR',
  message = 'Not Found',
  ...rest
}: BugEventFixture = {}): string => JSON.stringify({ ts: 1793174400000, level, type, message, ...rest });
