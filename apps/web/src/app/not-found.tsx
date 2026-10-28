import Link from 'next/link';
import { EmptyState } from '@/shared/components/empty-state';

export default function NotFound() {
  return (
    <EmptyState title="Page not found">
      <Link href="/branches" className="underline">
        Back to branches
      </Link>
    </EmptyState>
  );
}
