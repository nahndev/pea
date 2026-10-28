#!/usr/bin/env node
// PreToolUse(Bash) hook: checks CONTRIBUTING.md code rules before `git commit`.
// Exit 2 + stderr blocks the commit and feeds the violations back to Claude.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const COMMIT_TYPES = [
  'feat',
  'fix',
  'chore',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'revert',
];
const FRAMEWORK_FREE_PACKAGES = ['constants', 'types', 'utils'];
const FRAMEWORK_IMPORT = /^(react|react-dom|next|@nestjs|@prisma|express)(\/|$)/;
const WEB_ONLY_IMPORT = /^@tomato\/(ui|tailwind-config)(\/|$)/;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const git = (args, cwd) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const gitList = (args, cwd) => git(args, cwd).split('\0').filter(Boolean);

function readPayload() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function commitMessage(fullCommand) {
  const command = fullCommand.slice(fullCommand.search(/\bgit\s+commit\b/));
  const heredoc = command.match(/\$\(\s*cat\s+<<-?\s*['"]?(\w+)['"]?\n([\s\S]*?)\n\s*\1\b/);
  if (heredoc) return heredoc[2].split('\n').find((l) => l.trim())?.trim();
  const inline = command.match(/(?:^|\s)(?:-[a-zA-Z]*m|--message)[\s=]*(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/);
  const text = inline?.[1] ?? inline?.[2];
  return text?.split('\n').find((l) => l.trim())?.trim();
}

function importsOf(source) {
  const re =
    /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  return [...source.matchAll(re)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4]);
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|\s)\/\/.*$/gm, '$1');
}

function checkNaming(file, out) {
  const rest = file.split('/').slice(2);
  if (!rest.length) return;
  const dirs = rest.slice(0, -1);
  const base = rest.at(-1);

  for (const dir of dirs) {
    const name = dir.replace(/^\[+\.{0,3}|\]+$/g, '').replace(/^\(|\)$/g, '').replace(/^@/, '');
    if (name && !KEBAB.test(name)) out.push(`${file}: folder "${dir}" must be kebab-case`);
  }

  const stem = base.replace(/\.(tsx?|mts|cts)$/, '').replace(/\.d$/, '');
  const parts = stem.split('.');
  if (!parts.every((p) => KEBAB.test(p))) out.push(`${file}: file name must be kebab-case`);

  const isTest = /\.(spec|test)\.tsx?$/.test(base);
  if (dirs.at(-1) === 'hooks' && !isTest && stem !== 'index' && !stem.startsWith('use-')) {
    out.push(`${file}: hook file must be named use-xxx.ts`);
  }
}

function checkContent(file, source, out) {
  const [root, workspace] = file.split('/');
  const code = stripComments(source);
  const specs = importsOf(code);
  const isTest = /\.(spec|test)\.tsx?$/.test(file);

  if (/^\s*(export\s+)?(declare\s+)?(const\s+)?enum\s+\w+/m.test(code)) {
    out.push(`${file}: use an \`as const\` object instead of \`enum\``);
  }

  if (root === 'packages') {
    for (const spec of specs) {
      if (/^@tomato\/(api|web)(\/|$)/.test(spec) || /(^|\/)apps\//.test(spec)) {
        out.push(`${file}: packages must not import apps ("${spec}")`);
      }
      if (FRAMEWORK_FREE_PACKAGES.includes(workspace) && (FRAMEWORK_IMPORT.test(spec) || WEB_ONLY_IMPORT.test(spec))) {
        out.push(`${file}: @tomato/${workspace} must not depend on a framework ("${spec}")`);
      }
    }
  }

  if (root !== 'apps') return;

  if (workspace === 'api') {
    for (const spec of specs) {
      if (WEB_ONLY_IMPORT.test(spec)) out.push(`${file}: "${spec}" is for web only`);
    }
    if (!isTest && /new\s+\w*Exception\(\s*['"`]/.test(code)) {
      out.push(`${file}: do not hard-code error messages; use error codes from @tomato/constants`);
    }
    if (/\.controller\.ts$/.test(file)) {
      if (specs.some((s) => /\.repository$/.test(s)) || /\b(PrismaService|PrismaClient)\b/.test(code)) {
        out.push(`${file}: controllers only receive/return data; move logic to the service`);
      }
    }
    if (/\.service\.ts$/.test(file) && !/\/src\/common\//.test(file) && /\b(PrismaService|PrismaClient)\b/.test(code)) {
      out.push(`${file}: DB access belongs in the repository, not the service`);
    }
  }

  if (workspace === 'web' && !isTest) {
    const allowed = /\/(services|shared\/lib)\//.test(file);
    if (!allowed && (specs.includes('axios') || /(^|[^\w.])fetch\(/.test(code))) {
      out.push(`${file}: do not call the API directly; go through services/ (axios instance in shared/lib)`);
    }
  }

  const own = file.match(/^apps\/[^/]+\/src\/modules\/([^/]+)\//)?.[1];
  const srcRoot = `apps/${workspace}/src`;
  for (const spec of specs) {
    let resolved;
    if (spec.startsWith('.')) resolved = path.posix.join(path.posix.dirname(file), spec);
    else if (spec.startsWith('@/')) resolved = `${srcRoot}/${spec.slice(2)}`;
    else continue;
    const hit = resolved.match(/(?:^|\/)modules\/([^/]+)(\/.+)?$/);
    if (!hit || hit[1] === own || workspace !== 'web') continue;
    if (hit[2] && hit[2] !== '/index') {
      out.push(`${file}: import module "${hit[1]}" only through its index.ts ("${spec}")`);
    }
  }
}

const payload = readPayload();
const command = payload.tool_input?.command ?? '';
if (!/\bgit\s+commit\b/.test(command)) process.exit(0);

const cwd = git(['rev-parse', '--show-toplevel'], payload.cwd ?? process.cwd()).trim();
const includeWorktree = /\bgit\s+add\b/.test(command) || /\bcommit\b[^|&;]*\s(-[a-zA-Z]*a[a-zA-Z]*|--all)\b/.test(command);

const staged = gitList(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], cwd);
const worktree = includeWorktree
  ? [
      ...gitList(['diff', '--name-only', '--diff-filter=ACMR', '-z'], cwd),
      ...gitList(['ls-files', '--others', '--exclude-standard', '-z'], cwd),
    ]
  : [];
const files = [...new Set([...staged, ...worktree])].filter(
  (f) => /^(apps|packages)\/.+\.(ts|tsx)$/.test(f) && !/\.d\.ts$/.test(f) && !/(^|\/)(dist|node_modules|\.next)\//.test(f),
);

const violations = [];

for (const file of files) {
  checkNaming(file, violations);
  let source;
  try {
    source = includeWorktree ? readFileSync(path.join(cwd, file), 'utf8') : git(['show', `:${file}`], cwd);
  } catch {
    continue;
  }
  checkContent(file, source, violations);
}

const message = commitMessage(command);
if (message && !/^(Merge|Revert) /.test(message)) {
  const re = new RegExp(`^(${COMMIT_TYPES.join('|')})(\\([a-z0-9-]+\\))?!?: \\S`);
  if (!re.test(message)) {
    violations.push(`commit message "${message}" must follow Conventional Commits (type(scope): subject)`);
  }
}

if (violations.length) {
  process.stderr.write(
    `Code rule violations (see CONTRIBUTING.md). Fix them before committing:\n${violations.map((v) => `- ${v}`).join('\n')}\n`,
  );
  process.exit(2);
}
