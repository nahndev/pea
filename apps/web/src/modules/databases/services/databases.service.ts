import { DatabaseConnectionMode } from '@tomato/constants';
import type { DatabaseView } from '@tomato/types';
import { apiClient } from '@/shared/lib/api-client';
import type { DatabaseInput } from '../databases.schemas';

const toBody = (input: DatabaseInput) => {
  if (input.connectionMode === DatabaseConnectionMode.URL) {
    return { name: input.name, connectionString: input.connectionString };
  }
  const { name, host, port, database, user, password } = input;
  return { name, host, port, database, user, password: password || undefined };
};

export const databasesService = {
  async list() {
    const { data } = await apiClient.get<DatabaseView[]>('/databases');
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<DatabaseView>(`/databases/${id}`);
    return data;
  },

  async create(input: DatabaseInput) {
    const { data } = await apiClient.post<DatabaseView>('/databases', toBody(input));
    return data;
  },

  async update(id: string, input: DatabaseInput) {
    const { data } = await apiClient.patch<DatabaseView>(`/databases/${id}`, toBody(input));
    return data;
  },

  async remove(id: string) {
    await apiClient.delete(`/databases/${id}`);
  },
};
