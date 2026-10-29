'use client';

import type { AnalysisSchema } from '@tomato/constants';
import { Tabs, TabsList, TabsTrigger } from '@tomato/ui';
import Link from 'next/link';
import { ANALYSIS_SCHEMA_LABEL, analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';
import { buildHref } from '@/shared/lib/pagination';

interface BranchSchemaTabsProps {
  branchId: string;
  schema: AnalysisSchema;
}

export function BranchSchemaTabs({ branchId, schema }: BranchSchemaTabsProps) {
  return (
    <Tabs value={schema}>
      <TabsList aria-label="Analysis schemas">
        {analysisSchemaValues.map((value) => (
          <TabsTrigger key={value} value={value} asChild>
            <Link href={buildHref(`/branches/${branchId}`, { schema: value })}>{ANALYSIS_SCHEMA_LABEL[value]}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
