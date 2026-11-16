'use client';

import { Button } from '@tomato/ui';
import { LogOutIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LOGIN_PATH } from '@/shared/lib/login';
import { useCurrentUser, useLogout } from '../hooks/use-auth';

export function UserMenu() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { mutate, isPending } = useLogout();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end leading-tight">
        <span className="text-sm font-medium">{user.name}</span>
        <span className="text-xs text-muted-foreground">{user.group.name}</span>
      </div>
      <Button variant="ghost" intent="neutral" size="icon-sm" onClick={() => mutate(undefined, { onSettled: () => router.replace(LOGIN_PATH) })} disabled={isPending} aria-label="Sign out">
        <LogOutIcon aria-hidden />
      </Button>
    </div>
  );
}
