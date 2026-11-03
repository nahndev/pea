'use client';

import { Button, Skeleton, Tabs, TabsList, TabsTrigger } from '@tomato/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { formatDateTime } from '@/shared/lib/format';
import { useAnalysis, useAnalysisRunning, useRerunAnalysis } from '../hooks/use-analyses';
import { GateStatusBadge, ResultStatusBadge } from './analysis-status-badges';

interface AnalysisHeaderProps {
  analysisId: string;
}

const TABS = [
  { segment: 'issues', label: 'Issues' },
  { segment: 'metrics', label: 'Metrics' },
] as const;

export function AnalysisHeader({ analysisId }: AnalysisHeaderProps) {
  const pathname = usePathname();
  const { data, error } = useAnalysis(analysisId);
  const isRunning = useAnalysisRunning(analysisId);
  const { mutate: rerun, isPending: isRerunning, error: rerunError } = useRerunAnalysis(analysisId);
  const activeTab = TABS.find(({ segment }) => pathname.split('/').includes(segment))?.segment;

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-24 w-full max-w-md" />;

  const { branch, schema, title, latestResult, createdAt, file, database } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title={title} description={`Analysed on ${formatDateTime(createdAt)}`}>
          <Breadcrumbs
            entries={[
              { label: 'Branches', href: '/branches' },
              { label: branch.name, href: `/branches/${branch.id}/${schema.toLowerCase()}` },
              { label: title },
            ]}
          />
        </PageHeader>
        <Button variant="outlined" size="sm" onClick={() => rerun()} disabled={isRerunning || isRunning}>
          {isRerunning || isRunning ? 'Analysing…' : 'Re-analyse'}
        </Button>
      </div>
      {rerunError ? <ErrorState error={rerunError} title="Unable to re-analyse" /> : null}
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <dt className="text-muted-foreground">Branch</dt>
          <dd className="break-all font-medium">{branch.name}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-muted-foreground">Result</dt>
          <dd>{latestResult ? <ResultStatusBadge status={latestResult.status} /> : 'Pending'}</dd>
          {isRunning ? <span role="status" className="text-xs text-muted-foreground">Processing…</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-muted-foreground">Conditions</dt>
          <dd>
            <GateStatusBadge status={latestResult?.gateStatus ?? null} />
          </dd>
        </div>
        {file ? (
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">File</dt>
            <dd className="break-all font-mono text-xs font-medium">{file}</dd>
          </div>
        ) : null}
        {database ? (
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Database</dt>
            <dd className="flex flex-wrap items-baseline gap-2">
              <Link href={`/databases/${database.id}`} className="font-medium hover:underline focus-ring rounded-sm">
                {database.name}
              </Link>
              <span className="break-all font-mono text-xs text-muted-foreground">{database.address}</span>
            </dd>
          </div>
        ) : null}
      </dl>
      <Tabs value={activeTab}>
        <TabsList aria-label="Analysis sections">
          {TABS.map(({ segment, label }) => (
            <TabsTrigger key={segment} value={segment} asChild>
              <Link href={`/analyses/${analysisId}/${segment}`}>{label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
