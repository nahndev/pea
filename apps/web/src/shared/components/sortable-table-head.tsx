import { SortOrder } from '@tomato/constants';
import { TableHead, cn } from '@tomato/ui';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { nextOrdering, orderOf } from '../lib/sort';

interface SortableTableHeadProps {
  field: string;
  ordering: string | undefined;
  href: (ordering: string | undefined) => string;
  scroll?: boolean;
  className?: string;
  children: ReactNode;
}

export function SortableTableHead({ field, ordering, href, scroll, className, children }: SortableTableHeadProps) {
  const order = orderOf(ordering, field);
  const Icon = order === SortOrder.ASC ? ArrowUpIcon : order === SortOrder.DESC ? ArrowDownIcon : ArrowUpDownIcon;

  return (
    <TableHead className={className} aria-sort={order === SortOrder.ASC ? 'ascending' : order === SortOrder.DESC ? 'descending' : 'none'}>
      <Link
        href={href(nextOrdering(ordering, field))}
        scroll={scroll}
        className="inline-flex max-w-full items-center gap-1 rounded-sm underline-offset-4 hover:underline focus-ring"
      >
        <span className="truncate">{children}</span>
        <Icon className={cn('size-3.5 shrink-0', !order && 'text-muted-foreground')} aria-hidden="true" />
      </Link>
    </TableHead>
  );
}
