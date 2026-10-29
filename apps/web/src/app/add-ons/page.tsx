import type { Metadata } from 'next';
import { AddOnListView } from '@/modules/add-ons';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Add-ons' };

export default function AddOnsPage() {
  return (
    <>
      <PageHeader title="Add-ons" description="Tools that support the analysis workflow." />
      <AddOnListView />
    </>
  );
}
