import type { Metadata } from 'next';
import { RuleListView } from '@/modules/rules';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Rules' };

export default function RulesPage() {
  return (
    <>
      <PageHeader title="Rules" description="Rules used to create issues. Open a rule to configure it." />
      <RuleListView />
    </>
  );
}
