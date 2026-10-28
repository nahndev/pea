import { redirect } from 'next/navigation';

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { id: analysisId } = await params;
  redirect(`/analyses/${analysisId}/issues`);
}
