'use client';

import { RuleSortField } from '@tomato/constants';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { ErrorState } from '@/shared/components/error-state';
import { SortableTableHead } from '@/shared/components/sortable-table-head';
import { StatusBadge } from '@/shared/components/status-badge';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { buildHref } from '@/shared/lib/pagination';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { SortTable } from '@/shared/lib/sort.constants';
import { useRules } from '../hooks/use-rules';
import type { RuleListParams } from '../rules.schemas';

interface RuleListViewProps {
  params: RuleListParams;
}

export function RuleListView({ params }: RuleListViewProps) {
  const { data, error, isPending } = useRules(params);
  const { ordering } = params;
  const sortHref = (next: string | undefined) => buildHref('/rules', { schema: params.schema, ordering: next });

  return (
    <section className="flex flex-col gap-4">
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data ? (
        <div className="rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead field={RuleSortField.DESCRIPTION} cacheKey={SortTable.RULES} ordering={ordering} href={sortHref}>
                  Rule
                </SortableTableHead>
                <SortableTableHead field={RuleSortField.SEVERITY} cacheKey={SortTable.RULES} ordering={ordering} href={sortHref}>
                  Severity
                </SortableTableHead>
                <SortableTableHead field={RuleSortField.TYPE} cacheKey={SortTable.RULES} ordering={ordering} href={sortHref}>
                  Type
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    <Link href={`/rules/${rule.id}`} className="hover:underline focus-ring rounded-sm">
                      {rule.description}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge style={SEVERITY_STYLE[rule.severity]} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{rule.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
