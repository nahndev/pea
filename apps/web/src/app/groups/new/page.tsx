import type { Metadata } from 'next';
import { GroupCreateView } from '@/modules/groups';

export const metadata: Metadata = { title: 'Add group' };

export default function CreateGroupPage() {
  return <GroupCreateView />;
}
