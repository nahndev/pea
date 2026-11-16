import type { Metadata } from 'next';
import { UserCreateView } from '@/modules/users';

export const metadata: Metadata = { title: 'Add user' };

export default function CreateUserPage() {
  return <UserCreateView />;
}
