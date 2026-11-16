'use client';

import { GroupSortField, Permission } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { buildHref } from '@/shared/lib/pagination';
import { SortTable } from '@/shared/lib/sort.constants';
import type { GroupListParams } from '../groups.schemas';
import { useGroups } from '../hooks/use-groups';

const PERMISSION_COUNT = Object.values(Permission).length;

interface GroupListViewProps {
  params: GroupListParams;
}

export function GroupListView({ params }: GroupListViewProps) {
  const { data, error, isPending } = useGroups(params);
  const sortHref = (next: string | undefined) => buildHref('/groups', { ordering: next });

  return (
    <section className="flex flex-col gap-4">
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data?.length === 0 ? <EmptyState title="No group yet">Add a group to give users permissions.</EmptyState> : null}
      {data && data.length > 0 ? (
        <div className="rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead field={GroupSortField.NAME} cacheKey={SortTable.GROUPS} ordering={params.ordering} href={sortHref}>
                  Name
                </SortableTableHead>
                <SortableTableHead field={GroupSortField.PERMISSION_COUNT} cacheKey={SortTable.GROUPS} ordering={params.ordering} href={sortHref} className="text-right">
                  Permissions
                </SortableTableHead>
                <SortableTableHead field={GroupSortField.USER_COUNT} cacheKey={SortTable.GROUPS} ordering={params.ordering} href={sortHref} className="text-right">
                  Users
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ id, name, permissions, users }) => (
                <TableRow key={id}>
                  <TableCell className="font-medium">
                    <Link href={`/groups/${id}`} className="hover:underline focus-ring rounded-sm">
                      {name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {permissions.length}
                    <span className="text-muted-foreground"> / {PERMISSION_COUNT}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{users.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
