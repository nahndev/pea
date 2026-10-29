import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export function AppHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <nav className="flex items-center gap-6">
          <Link href="/branches" className="text-base font-semibold focus-ring rounded-sm">
            Pea
          </Link>
          <Link href="/branches" className="text-sm text-muted-foreground hover:text-foreground focus-ring rounded-sm">
            Branches
          </Link>
          <Link href="/add-ons" className="text-sm text-muted-foreground hover:text-foreground focus-ring rounded-sm">
            Add-ons
          </Link>
          <Link href="/rules" className="text-sm text-muted-foreground hover:text-foreground focus-ring rounded-sm">
            Rules
          </Link>
          <Link href="/conditions" className="text-sm text-muted-foreground hover:text-foreground focus-ring rounded-sm">
            Conditions
          </Link>
          <Link href="/metrics" className="text-sm text-muted-foreground hover:text-foreground focus-ring rounded-sm">
            Metrics
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
