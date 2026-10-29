'use client';

import { IssueStatus, RuleType, Severity } from '@tomato/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tomato/ui';
import { useRouter } from 'next/navigation';
import { buildHref } from '@/shared/lib/pagination';
import { SEVERITY_STYLE } from '@/shared/lib/severity.constants';
import { ALL_FILTER, ISSUE_STATUS_STYLE, RULE_TYPE_LABEL } from '../issues.constants';
import type { IssueListParams } from '../issues.schemas';

interface IssueFiltersProps {
  analysisId: string;
  params: IssueListParams;
}

export function IssueFilters({ analysisId, params }: IssueFiltersProps) {
  const router = useRouter();
  const pathname = `/analyses/${analysisId}/issues`;

  const update = (change: Partial<Pick<IssueListParams, 'status' | 'severity' | 'ruleType'>>) => {
    const next = { ...params, ...change };
    router.push(buildHref(pathname, { status: next.status, severity: next.severity, ruleType: next.ruleType }));
  };
  const toFilter = (value: string) => (value === ALL_FILTER ? undefined : value);

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={params.status ?? ALL_FILTER} onValueChange={(value) => update({ status: toFilter(value) as IssueStatus | undefined })}>
        <SelectTrigger aria-label="Filter by status" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
          {Object.values(IssueStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {ISSUE_STATUS_STYLE[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.severity ?? ALL_FILTER} onValueChange={(value) => update({ severity: toFilter(value) as Severity | undefined })}>
        <SelectTrigger aria-label="Filter by severity" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER}>All severities</SelectItem>
          {Object.values(Severity).map((severity) => (
            <SelectItem key={severity} value={severity}>
              {SEVERITY_STYLE[severity].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.ruleType ?? ALL_FILTER} onValueChange={(value) => update({ ruleType: toFilter(value) as RuleType | undefined })}>
        <SelectTrigger aria-label="Filter by rule" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER}>All rules</SelectItem>
          {Object.values(RuleType).map((ruleType) => (
            <SelectItem key={ruleType} value={ruleType}>
              {RULE_TYPE_LABEL[ruleType]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
