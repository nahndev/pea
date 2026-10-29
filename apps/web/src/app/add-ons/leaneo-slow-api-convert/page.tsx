import type { Metadata } from 'next';
import { LeaneoSlowApiConvertForm } from '@/modules/add-ons';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'LeaneoSlowApiConvert' };

export default function LeaneoSlowApiConvertPage() {
  return (
    <>
      <PageHeader title="LeaneoSlowApiConvert" description="Convert a slow_api.log file to the OTLP api_metric format used by analyses.">
        <Breadcrumbs entries={[{ label: 'Add-ons', href: '/add-ons' }, { label: 'LeaneoSlowApiConvert' }]} />
      </PageHeader>
      <LeaneoSlowApiConvertForm />
    </>
  );
}
