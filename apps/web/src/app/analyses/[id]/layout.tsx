import type { ReactNode } from 'react';
import { AnalysisHeader } from '@/modules/analyses';

interface AnalysisLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function AnalysisLayout({ children, params }: AnalysisLayoutProps) {
  const { id: analysisId } = await params;

  return (
    <>
      <AnalysisHeader analysisId={analysisId} />
      {children}
    </>
  );
}
