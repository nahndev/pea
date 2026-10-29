'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tomato/ui';
import Link from 'next/link';
import { ErrorState } from '@/shared/components/error-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { ANALYSIS_SCHEMA_LABEL } from '@/shared/lib/analysis-schema.constants';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { useRules } from '../hooks/use-rules';

export function RuleListView() {
  const { data, error, isPending } = useRules();

  return (
    <section className="flex flex-col gap-4">
      {isPending ? <TableSkeleton /> : null}
      {error ? <ErrorState error={error} /> : null}
      {data ? (
        <div className="rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
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
                  <TableCell>{ANALYSIS_SCHEMA_LABEL[rule.schema]}</TableCell>
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
