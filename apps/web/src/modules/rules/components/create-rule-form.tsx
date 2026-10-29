'use client';

import type { RuleView } from '@tomato/types';
import { useState } from 'react';
import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { PageHeader } from '@/shared/components/page-header';
import { RuleBaseStep } from './rule-base-step';
import { RuleDetailsStep } from './rule-details-step';

export function CreateRuleForm() {
  const [base, setBase] = useState<RuleView>();
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Create rule" description={step === 1 ? 'Step 1 of 2 · Choose a base rule' : 'Step 2 of 2 · Configure the new rule'}>
        <Breadcrumbs entries={[{ label: 'Rules', href: '/rules' }, { label: 'Create rule' }]} />
      </PageHeader>
      {step === 1 || !base ? (
        <RuleBaseStep baseId={base?.id} onSelect={setBase} onNext={() => setStep(2)} />
      ) : (
        <RuleDetailsStep key={base.id} base={base} onBack={() => setStep(1)} />
      )}
    </div>
  );
}
