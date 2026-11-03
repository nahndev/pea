import type { DatabaseConnectionMode } from '@tomato/constants';

export interface DatabaseSummary {
  id: string;
  name: string;
  /** `user@host:port/database`, without the password */
  address: string;
}

export type DatabaseConnectionView =
  | { mode: typeof DatabaseConnectionMode.URL }
  | { mode: typeof DatabaseConnectionMode.FIELDS; host: string; port: number; database: string; user: string };

export interface DatabaseView extends DatabaseSummary {
  connection: DatabaseConnectionView;
  analysisCount: number;
  createdAt: string;
  updatedAt: string;
}
