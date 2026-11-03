# Add Databases menu with pre-defined database connections

## Currently

- The app header ([app-header.tsx](../../apps/web/src/shared/components/app-header.tsx)) has `Branches`, `Add-ons`, `Rules`, `Conditions` and `Metrics`; there is no entry point for databases.
- A `DATABASE` analysis takes its PostgreSQL connection inline in the creation dialog ([database-analysis-creation.tsx](../../apps/web/src/modules/analyses/components/database-analysis-creation.tsx)): tabs "Fields" (host, port, database, user, password) / "Connection string". Users must re-type the connection (including the password) for every analysis.
- The connection is verified, encrypted with AES-256-GCM (`DATABASE_CONNECTION_KEY`) by [database-connections.service.ts](../../apps/api/src/modules/database-connections/database-connections.service.ts) and stored per analysis in `DatabaseAnalysisData.connection` ([schema.prisma](../../apps/api/prisma/schema.prisma)). The same database analysed many times is stored as many copies.
- The `database-connections` API module is a service only (encrypt/decrypt/describe/verify/`withClient`); there is no table, controller or web module for saved connections, so they cannot be listed, named, edited or reused.
- `AnalysisDetail` shows the database as `user@host:port/database` (`describe`), with no link to a named connection.

## Acceptance Criteria

- [x] Add menu `database`
- [x] Allow CRUD database connection
- [x] Every `database` include connect string or (user, pass, host, port, ....)
- [x] Update `DatabaseAnalysisData` using `database` instead of using every config

## Solutions

- [x] `Database` (`databases`): unique `name`, `connection` encrypted with AES-256-GCM; `DatabaseAnalysisData.database_id` replaces `connection` (`ON DELETE RESTRICT`)
- [x] Migration `add_databases` creates one database per existing database analysis (named `<title> (<id prefix>)`) before dropping `connection`
- [x] API `databases` module: `GET/POST /databases`, `GET/PATCH/DELETE /databases/:id`; connection verified on create and on connection change (`DATABASE_CONNECTION_FAILED`), never returns the password nor the connection string
- [x] Update keeps the stored password when host and user are unchanged and none is given; a blank connection string keeps the stored one
- [x] Errors: `DATABASE_NOT_FOUND`, `DATABASE_ALREADY_EXISTS`, `DATABASE_IN_USE` (delete refused while analyses use it)
- [x] Analysis creation takes `databaseId` (verified before creating), detail returns `database: { id, name, address }`
- [x] Web: `Databases` header menu, list / add / edit + delete pages; new analysis picks a saved database; `DatabaseConnectionMode` moved to `@tomato/constants`
