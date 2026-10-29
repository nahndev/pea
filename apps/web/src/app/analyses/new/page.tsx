import type { Metadata } from 'next';
import { z } from 'zod';
import { NewAnalysisForm } from '@/modules/analyses';
import { analysisSchemaValues } from '@/shared/lib/analysis-schema.constants';

export const metadata: Metadata = { title: 'New analysis' };

const searchParamsSchema = z.object({
  branch: z.string().trim().max(255).optional().catch(undefined),
  schema: z.enum(analysisSchemaValues).optional().catch(undefined),
});

interface NewAnalysisPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewAnalysisPage({ searchParams }: NewAnalysisPageProps) {
  const { branch, schema } = searchParamsSchema.parse(await searchParams);

  return <NewAnalysisForm branch={branch} schema={schema} />;
}
