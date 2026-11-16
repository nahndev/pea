import type { Metadata } from 'next';
import { CreateRepoForm } from '@/modules/repos';

export const metadata: Metadata = { title: 'Create repo' };

export default function CreateRepoPage() {
  return <CreateRepoForm />;
}
