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
