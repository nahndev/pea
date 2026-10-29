# Add severity for rule

## Currently

- A rule ([schema.prisma](../../apps/api/prisma/schema.prisma) `Rule`) only has `type`, `description` and `config`; there is no severity, so every issue looks equally important.
- Issues ([issue.types.ts](../../packages/types/src/issue.types.ts)) only expose `status` and the rule's `type`/`description`; users cannot tell a blocker from a minor finding or filter by importance.
- The rule config page (`/rules/{id}`) can only change numeric config (`thresholdMs`, `maxPercent`, `minRequests`).
- Goal: give each rule a severity, configurable from the rule detail page, and show it on the issues it creates.

## Acceptance Criteria

- [x] Add severity with value is `blocker`,`high`,`medium`,`low`,`info`
- [x] Update MetricCondition issue base on type
- [ ]

## Solutions

- [x] Add record `severity` to database
- [x] Add `MetricCondition` base on count `issue` with `severity`
- [ ]
