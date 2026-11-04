import type { Metadata } from 'next';
import { LeaneoExceptionsConvertForm } from '@/modules/add-ons';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'LeaneoExceptionsConvert' };

export default function LeaneoExceptionsConvertPage() {
  return (
    <>
      <PageHeader title="LeaneoExceptionsConvert" description="Convert an exceptions.log file to the bug_log format used by analyses.">
        <Breadcrumbs entries={[{ label: 'Add-ons', href: '/add-ons' }, { label: 'LeaneoExceptionsConvert' }]} />
      </PageHeader>
      <LeaneoExceptionsConvertForm />
    </>
  );
}
