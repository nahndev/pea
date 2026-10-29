# Adjust all pages to group by schema

## Currently

- The previous ticket ([support-analysis-schema.md](support-analysis-schema.md)) added `schema` to `Analysis`, `Rule`, `Metric` and `MetricCondition` in [schema.prisma](../../apps/api/prisma/schema.prisma), and only the branch details page (`/branches/:id`) was changed into tabs per `schema`.
- The other pages under [apps/web/src/app](../../apps/web/src/app) (`add-ons`, `analyses`, `conditions`, `metrics`, `rules`, and the branches list) still show every record in one flat list, mixing records of different `schema` together.
- A rule, metric or condition only applies to analyses of the same `schema`, so a flat list makes it unclear which `schema` each record belongs to.

## Acceptance Criteria

- [x] All page of `rules`, `metrics`, `conditions` group by schema
- [x] Group include `create` button (rules, conditions; metrics are seeded and have no create flow)
- [x] Creation form should apply `schema`

## Solutions

- [x] Update ui base on group
- [x] Update all endpoint should support `schema`
- [ ]
