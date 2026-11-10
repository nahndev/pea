'use client';

import { Button } from '@tomato/ui';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const COPIED_RESET_MS = 2000;

interface IssueCopyButtonProps {
  text: string;
}

export function IssueCopyButton({ text }: IssueCopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
  };

  return (
    <Button variant="outlined" intent="neutral" size="sm" onClick={handleCopy}>
      {isCopied ? <CheckIcon /> : <CopyIcon />}
      {isCopied ? 'Copied' : 'Copy as title'}
    </Button>
  );
}
