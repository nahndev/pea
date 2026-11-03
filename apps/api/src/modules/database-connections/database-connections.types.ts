import type { SubjectSource } from '../subjects/subject';

export interface DatabaseConnectionUrl {
  connectionString: string;
}

export interface DatabaseConnectionFields {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
}

export type DatabaseConnection = DatabaseConnectionUrl | DatabaseConnectionFields;

export interface QueryStat {
  calls: number;
  execMs: number;
}

export interface SubjectQueryStat extends QueryStat {
  subject: SubjectSource;
}

export interface QueryStatsSnapshot {
  takenAt: Date;
  /** By query subject uuid */
  queries: Record<string, QueryStat>;
}
