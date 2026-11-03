import type { Metadata } from 'next';
import { DatabaseCreateView } from '@/modules/databases';

export const metadata: Metadata = { title: 'Add database' };

export default function CreateDatabasePage() {
  return <DatabaseCreateView />;
}
