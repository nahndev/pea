import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@tomato/ui';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { toPageCount } from '../lib/pagination';
import { PAGE_SIZE } from '../lib/pagination.constants';

interface PaginationBarProps {
  page: number;
  total: number;
  buildHref: (page: number) => string;
}

export function PaginationBar({ page, total, buildHref }: PaginationBarProps) {
  const pageCount = toPageCount(total);
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const hasPrevious = page > 1;
  const hasNext = page < pageCount;

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            {hasPrevious ? (
              <PaginationLink asChild size="default">
                <Link href={buildHref(page - 1)} aria-label="Previous page">
                  <ChevronLeftIcon />
                  Previous
                </Link>
              </PaginationLink>
            ) : (
              <PaginationLink size="default" aria-disabled="true" tabIndex={-1}>
                <ChevronLeftIcon />
                Previous
              </PaginationLink>
            )}
          </PaginationItem>
          <PaginationItem>
            <span className="px-2 text-sm text-muted-foreground">
              Page {page} of {pageCount}
            </span>
          </PaginationItem>
          <PaginationItem>
            {hasNext ? (
              <PaginationLink asChild size="default">
                <Link href={buildHref(page + 1)} aria-label="Next page">
                  Next
                  <ChevronRightIcon />
                </Link>
              </PaginationLink>
            ) : (
              <PaginationLink size="default" aria-disabled="true" tabIndex={-1}>
                Next
                <ChevronRightIcon />
              </PaginationLink>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
