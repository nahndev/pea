import { PageHeader } from '@/shared/components/page-header';
import { LoginForm } from './login-form';

interface LoginViewProps {
  next?: string;
}

export function LoginView({ next }: LoginViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 pt-12">
      <PageHeader title="Sign in" description="Use the account an administrator created for you." />
      <LoginForm next={next} />
    </div>
  );
}
