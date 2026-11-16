import type { UserSummary } from '@tomato/types';
import Link from 'next/link';

interface GroupMembersProps {
  users: UserSummary[];
}

export function GroupMembers({ users }: GroupMembersProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-card">
      <h2 className="text-sm font-medium">Users ({users.length})</h2>
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No user in this group yet. Pick this group when adding or editing a user.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {users.map(({ id, name, username }) => (
            <li key={id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <Link href={`/users/${id}`} className="font-medium hover:underline focus-ring rounded-sm">
                {name}
              </Link>
              <span className="font-mono text-xs text-muted-foreground">{username}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
