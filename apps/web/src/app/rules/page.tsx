import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RuleListView } from '@/modules/rules';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Rules' };

export default function RulesPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Rules" description="Rules used to create issues. Open a rule to configure it." />
        <Link href="/rules/new" className={buttonVariants({ size: 'sm' })}>
          Create rule
        </Link>
      </div>
      <RuleListView />
    </>
  );
}
