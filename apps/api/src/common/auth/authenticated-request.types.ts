import type { CurrentUser } from '@tomato/types';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & { user: CurrentUser };
