import type { Metadata } from 'next';
import { IssueDetailView } from '@/modules/issues';

export const metadata: Metadata = { title: 'Issue' };

interface IssuePageProps {
  params: Promise<{ id: string; 'issue-id': string }>;
}

export default async function IssuePage({ params }: IssuePageProps) {
  const { id: analysisId, 'issue-id': issueId } = await params;

  return <IssueDetailView analysisId={analysisId} issueId={issueId} />;
}
