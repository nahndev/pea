import { Severity } from '@tomato/constants';
import type { StatusStyle } from '../components/status-badge';

export const SEVERITY_STYLE: Record<Severity, StatusStyle> = {
  [Severity.BLOCKER]: { label: 'Blocker', intent: 'danger' },
  [Severity.HIGH]: { label: 'High', intent: 'warning' },
  [Severity.MEDIUM]: { label: 'Medium', intent: 'info' },
  [Severity.LOW]: { label: 'Low', intent: 'accent' },
  [Severity.INFO]: { label: 'Info', intent: 'neutral' },
};
