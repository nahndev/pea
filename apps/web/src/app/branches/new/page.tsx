import type { Metadata } from 'next';
import { CreateBranchForm } from '@/modules/branches';

export const metadata: Metadata = { title: 'Create branch' };

export default function CreateBranchPage() {
  return <CreateBranchForm />;
}
