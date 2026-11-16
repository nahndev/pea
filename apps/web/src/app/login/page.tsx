import type { Metadata } from 'next';
import { LoginView } from '@/modules/auth';
import { NEXT_PARAM } from '@/shared/lib/login';

export const metadata: Metadata = { title: 'Sign in' };

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const next = (await searchParams)[NEXT_PARAM];

  return <LoginView next={typeof next === 'string' ? next : undefined} />;
}
