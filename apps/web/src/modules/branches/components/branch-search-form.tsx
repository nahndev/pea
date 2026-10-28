'use client';

import { Button, Input } from '@tomato/ui';
import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { buildHref } from '@/shared/lib/pagination';

interface BranchSearchFormProps {
  search?: string;
}

export function BranchSearchForm({ search = '' }: BranchSearchFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(search);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.push(buildHref('/branches', { q: value.trim() }));
  };

  return (
    <form onSubmit={submit} role="search" className="flex w-full max-w-sm gap-2">
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search branches"
        aria-label="Search branches"
        maxLength={255}
      />
      <Button type="submit" variant="soft" size="icon" aria-label="Search">
        <SearchIcon />
      </Button>
    </form>
  );
}
