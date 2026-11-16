'use client';

import { UserSortField } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { formatDateTime } from '@/shared/lib/format';
import { buildHref } from '@/shared/lib/pagination';
import { SortTable } from '@/shared/lib/sort.constants';
import { useUsers } from '../hooks/use-users';
import type { UserListParams } from '../users.schemas';

interface UserListViewProps {
  params: UserListParams;
}

export function UserListView({ params }: UserListViewProps) {
  const { data, error, isPending } = useUsers(params);
  const sortHref = (next: string | undefined) => buildHref('/users', { ordering: next });

  return (
    <section className="flex flex-col gap-4">
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data?.length === 0 ? <EmptyState title="No user yet">Add a user so they can sign in.</EmptyState> : null}
      {data && data.length > 0 ? (
        <div className="rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead field={UserSortField.NAME} cacheKey={SortTable.USERS} ordering={params.ordering} href={sortHref}>
                  Name
                </SortableTableHead>
                <SortableTableHead field={UserSortField.USERNAME} cacheKey={SortTable.USERS} ordering={params.ordering} href={sortHref}>
                  Username
                </SortableTableHead>
                <SortableTableHead field={UserSortField.GROUP} cacheKey={SortTable.USERS} ordering={params.ordering} href={sortHref}>
                  Group
                </SortableTableHead>
                <SortableTableHead field={UserSortField.CREATED_AT} cacheKey={SortTable.USERS} ordering={params.ordering} href={sortHref}>
                  Created
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ id, name, username, group, createdAt }) => (
                <TableRow key={id}>
                  <TableCell className="font-medium">
                    <Link href={`/users/${id}`} className="hover:underline focus-ring rounded-sm">
                      {name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{username}</TableCell>
                  <TableCell>
                    <Link href={`/groups/${group.id}`} className="hover:underline focus-ring rounded-sm">
                      {group.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
