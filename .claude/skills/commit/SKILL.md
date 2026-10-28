---
name: commit
description: Commit the current changes as a Conventional Commit on master. Use when asked to commit; does not push unless asked.
---

# Commit

## Rules

1. Work on `master`; do not create or checkout a branch.
2. Message is a Conventional Commit: `type(scope): subject` — the `check-code-rules` hook blocks anything else.
   - `type`: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`
   - `scope`: optional, `kebab-case` (e.g. the app, package or module touched)
   - `subject`: imperative, lowercase, no trailing period, ≤ 72 chars
3. Pass the message with `-m` (or a heredoc) so the hook can read it.
4. Never `--no-verify`, never amend or force anything unless asked.
5. Do not push unless asked.
6. Never commit secrets (`.env`, keys, credentials); warn and skip them.

## Steps

1. **Inspect** — run `git status` and `git diff` (staged and unstaged) to understand the change.
2. **Stage** — `git add` the relevant files by name. Split unrelated changes into separate commits.
3. **Message** — pick the `type` from the nature of the change and the `scope` from the area touched. Add a short body only when the *why* is not obvious.
4. **Commit** — `git commit -m "<message>"`. If the hook reports violations, fix them and commit again (a new commit, no `--no-verify`).

## Report

State the commit hash and message, and anything left uncommitted.
