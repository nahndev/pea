import type { AnalysisSchema } from '@tomato/constants';
import { Tabs, TabsList, TabsTrigger } from '@tomato/ui';
import Link from 'next/link';
import { ANALYSIS_SCHEMA_LABEL, analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';
import { buildHref } from '@/shared/lib/pagination';

interface SchemaTabsProps {
  pathname: string;
  schema: AnalysisSchema;
}

export function SchemaTabs({ pathname, schema }: SchemaTabsProps) {
  return (
    <Tabs value={schema}>
      <TabsList aria-label="Analysis schemas">
        {analysisSchemaValues.map((value) => (
          <TabsTrigger key={value} value={value} asChild>
            <Link href={buildHref(pathname, { schema: value })}>{ANALYSIS_SCHEMA_LABEL[value]}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
