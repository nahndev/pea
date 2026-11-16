'use client';

import { type AnalysisSchema, Permission } from '@tomato/constants';
import { Skeleton, buttonVariants } from '@tomato/ui';
import Link from 'next/link';
import { RequirePermission } from '@/modules/auth';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { ErrorState } from '@/shared/components/error-state';
import { PageHeader } from '@/shared/components/page-header';
import { buildHref } from '@/shared/lib/pagination';
import { useRepo } from '../hooks/use-repos';
import { DeleteRepoDialog } from './delete-repo-dialog';

interface RepoHeaderProps {
  repoId: string;
  schema: AnalysisSchema;
}

export function RepoHeader({ repoId, schema }: RepoHeaderProps) {
  const { data, error } = useRepo(repoId);

  if (error) return <ErrorState error={error} />;
  if (!data) return <Skeleton className="h-16 w-full max-w-md" />;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <PageHeader title={data.name} description="Analysis results for this repository, newest first.">
        <Breadcrumbs entries={[{ label: 'Repositories', href: '/repos' }, { label: data.name }]} />
      </PageHeader>
      <div className="flex gap-2">
        <RequirePermission permission={Permission.REPO_ANALYSIS}>
          <Link href={buildHref('/analyses/new', { repo: data.name, schema })} className={buttonVariants({ variant: 'outlined', size: 'sm' })}>
            New analysis
          </Link>
        </RequirePermission>
        <RequirePermission permission={Permission.REPO_DELETE}>
          <DeleteRepoDialog repo={data} />
        </RequirePermission>
      </div>
    </div>
  );
}
