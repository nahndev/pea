import { buttonVariants } from '@tomato/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ConditionListView } from '@/modules/conditions';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Conditions' };

export default function ConditionsPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Conditions" description="Limits the quality gate checks on each metric. Open a condition to edit it." />
        <Link href="/conditions/new" className={buttonVariants({ size: 'sm' })}>
          Create condition
        </Link>
      </div>
      <ConditionListView />
    </>
  );
}
