import { Badge } from '@tomato/ui';
import type { ComponentProps } from 'react';

type Intent = NonNullable<ComponentProps<typeof Badge>['intent']>;

export interface StatusStyle {
  label: string;
  intent: Intent;
}

interface StatusBadgeProps {
  style: StatusStyle;
}

export function StatusBadge({ style }: StatusBadgeProps) {
  return <Badge intent={style.intent}>{style.label}</Badge>;
}
