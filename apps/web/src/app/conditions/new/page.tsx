import type { Metadata } from 'next';
import { ConditionCreateForm } from '@/modules/conditions';

export const metadata: Metadata = { title: 'Create condition' };

export default function CreateConditionPage() {
  return <ConditionCreateForm />;
}
