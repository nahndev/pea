import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@tomato/ui';
import Link from 'next/link';
import { Fragment } from 'react';

export interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  entries: BreadcrumbEntry[];
}

export function Breadcrumbs({ entries }: BreadcrumbsProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {entries.map(({ label, href }, index) => (
          <Fragment key={`${index}-${label}`}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {href ? (
                <BreadcrumbLink asChild>
                  <Link href={href}>{label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
