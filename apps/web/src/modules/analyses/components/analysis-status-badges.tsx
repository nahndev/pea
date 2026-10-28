import type { AnalysisResultStatus, MetricEvaluationStatus } from '@tomato/constants';
import { StatusBadge } from '@/shared/components/status-badge';
import { GATE_STATUS_STYLE, RESULT_STATUS_STYLE } from '../analyses.constants';

export const ResultStatusBadge = ({ status }: { status: AnalysisResultStatus }) => <StatusBadge style={RESULT_STATUS_STYLE[status]} />;

export const GateStatusBadge = ({ status }: { status: MetricEvaluationStatus | null }) =>
  status ? <StatusBadge style={GATE_STATUS_STYLE[status]} /> : <span className="text-muted-foreground">—</span>;
