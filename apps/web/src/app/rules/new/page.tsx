import type { Metadata } from 'next';
import { CreateRuleForm } from '@/modules/rules';

export const metadata: Metadata = { title: 'Create rule' };

export default function CreateRulePage() {
  return <CreateRuleForm />;
}
