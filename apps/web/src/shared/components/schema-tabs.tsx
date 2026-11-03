import type { AnalysisSchema } from '@tomato/constants';
import type { AnalysisCountBySchema } from '@tomato/types';
import { Badge, Tabs, TabsList, TabsTrigger } from '@tomato/ui';
import Link from 'next/link';
import { ANALYSIS_SCHEMA_LABEL, analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';

interface SchemaTabsProps {
  schema: AnalysisSchema;
  href: (schema: AnalysisSchema) => string;
  counts?: AnalysisCountBySchema;
}

export function SchemaTabs({ schema, href, counts }: SchemaTabsProps) {
  return (
    <Tabs value={schema}>
      <TabsList aria-label="Analysis schemas">
        {analysisSchemaValues.map((value) => (
          <TabsTrigger key={value} value={value} asChild>
            <Link href={href(value)}>
              {ANALYSIS_SCHEMA_LABEL[value]}
              {!!counts?.[value] && <Badge>{counts[value]}</Badge>}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
