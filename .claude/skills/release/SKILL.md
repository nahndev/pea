---
name: release
description: Cut a release <version> - push a release-<version> branch, bump versions on master, and open the next changelogs/<next-version> folder. Use when asked to release/cut a version.
---

# Release

Input: `<version>` (the version being released, semver without `v`, e.g. `0.2.0`) and `<next-version>` (the next version in progress). Ask for either if not given.

Tickets of `<version>` already live in `changelogs/<version>/` (see `/ticket`).

## Rules

1. Start from `master`; stop and report on any failure. Do not force anything.
2. This is the only flow allowed to leave `master` (the "work on master" rule in `CONTRIBUTING.md` does not apply here); always return to `master` at the end.
3. Commits are Conventional Commits.

## Steps

1. **Checkout release branch** — `git checkout -b release-<version>`.
2. **Commit and push** — if the tree has pending changes, `git add -A` and commit `chore(release): prepare <version>`; then `git push -u origin release-<version>`.
3. **Back to master** — `git checkout master`.
4. **Bump version** — set `"version": "<version>"` in the root `package.json` (add the field if missing) and in every workspace `package.json` (`apps/*`, `packages/*`):
   - `git ls-files '*package.json'` lists them; edit only the `version` field, keep the rest and formatting untouched.
   - `git commit -m "chore(release): bump version to <version>"`
5. **Open next version** — `mkdir -p changelogs/<next-version>` with an empty `.gitkeep` so git tracks it; `git commit -m "chore(release): open changelogs for <next-version>"`; then `git push`.

## Report

State the branch name, the packages bumped, the new changelog folder and the commit hashes.
