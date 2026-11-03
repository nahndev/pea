# Split option properties of Analysis into new table

## Currently

- `Analysis` ([schema.prisma](../../apps/api/prisma/schema.prisma)) mixes common columns (`branchId`, `schema`, `title`, `createdAt`) with schema-specific options, all nullable:
  - `file`, `path`: uploaded log file, only for `API` / `QUERY` / `BUG`
  - `connection`: AES-256-GCM encrypted database connection, only for `DATABASE`
- Nothing enforces which options a schema needs; [analyses.service.ts](../../apps/api/src/modules/analyses/analyses.service.ts) branches on `schema === AnalysisSchema.DATABASE` to set either `connection` or `file`/`path`, and every new schema adds more nullable columns to `analyses`.
- [analyses.repository.ts](../../apps/api/src/modules/analyses/analyses.repository.ts) writes options inline (`{ branchId, schema, title, connection, ...file }`).
- Rule and metric handlers read `analysis.path` directly (e.g. [latency.handler.ts](../../apps/api/src/modules/rules/handlers/latency.handler.ts), [percentile.handler.ts](../../apps/api/src/modules/metrics/handlers/percentile.handler.ts)), although `path` is nullable now that `DATABASE` analyses have none.
- `findDetail` maps options into `AnalysisDetail` ([analysis.types.ts](../../packages/types/src/analysis.types.ts)) as `file` and `database` (decrypted `user@host:port/database`).

## Acceptance Criteria

- [ ] Create `ApiAnalysisData` include `file` and `path`
- [ ] Create `DatabaseAnalysisData` include `connection`
- [ ] `ApiAnalysisData` and `DatabaseAnalysisData` link to `Analysis`
