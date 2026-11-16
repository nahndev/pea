import type { Metadata } from 'next';
import { CreateRepoForm } from '@/modules/repos';

export const metadata: Metadata = { title: 'Create repository' };

export default function CreateRepoPage() {
  return <CreateRepoForm />;
}
