'use client';

import { Permission } from '@tomato/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequirePermission, UserMenu } from '@/modules/auth';
import { LOGIN_PATH } from '../lib/login';
import { ThemeToggle } from './theme-toggle';

const NAV_LINKS = [
  { href: '/repos', label: 'Repositories', permission: Permission.REPO_VIEW },
  { href: '/rules', label: 'Rules', permission: Permission.MANAGER_RULE },
  { href: '/conditions', label: 'Conditions', permission: Permission.MANAGER_CONDITION },
  { href: '/metrics', label: 'Metrics', permission: Permission.MANAGER_METRIC },
  { href: '/databases', label: 'Databases', permission: Permission.MANAGER_DATABASE },
  { href: '/charts', label: 'Chart', permission: Permission.MANAGER_METRIC },
  { href: '/users', label: 'Users', permission: Permission.MANAGER_USER },
  { href: '/groups', label: 'Groups', permission: Permission.MANAGER_USER },
];

function MainNav() {
  return NAV_LINKS.map(({ href, label, permission }) => (
    <RequirePermission key={href} permission={permission}>
      <Link href={href} className="text-sm text-muted-foreground hover:text-foreground focus-ring rounded-sm">
        {label}
      </Link>
    </RequirePermission>
  ));
}

export function AppHeader() {
  const isLoginPage = usePathname() === LOGIN_PATH;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold focus-ring rounded-sm">
            Pea
          </Link>
          {isLoginPage ? null : <MainNav />}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isLoginPage ? null : <UserMenu />}
        </div>
      </div>
    </header>
  );
}
