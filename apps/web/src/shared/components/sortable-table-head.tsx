"use client";

import { SortOrder } from "@tomato/constants";
import { TableHead, cn } from "@tomato/ui";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { nextOrdering, orderOf, saveOrdering } from "../lib/sort";
import type { SortTable } from "../lib/sort.constants";

interface SortableTableHeadProps {
  field: string;
  cacheKey: SortTable;
  ordering: string | undefined;
  href: (ordering: string | undefined) => string;
  scroll?: boolean;
  className?: string;
  children: ReactNode;
}

function getOrderValue<T>(
  order: SortOrder | undefined,
  ascValue: T,
  descValue: T,
  defaultValue: T,
): T {
  return order === SortOrder.ASC
    ? ascValue
    : order === SortOrder.DESC
      ? descValue
      : defaultValue;
}

export function SortableTableHead({
  field,
  cacheKey,
  ordering,
  href,
  scroll,
  className,
  children,
}: SortableTableHeadProps) {
  const order = orderOf(ordering, field);
  const next = nextOrdering(ordering, field);
  const iconProps = {
    className: cn("size-3.5 shrink-0", !order && "text-muted-foreground"),
    "aria-hidden": true,
  };
  const icon = getOrderValue(
    order,
    <ArrowUpIcon {...iconProps} />,
    <ArrowDownIcon {...iconProps} />,
    <ArrowUpDownIcon {...iconProps} />,
  );
  const iconClassName = getOrderValue(
    order,
    "visible",
    "visible",
    "invisible group-hover:visible",
  );

  return (
    <TableHead
      className={cn(className, "group")}
      aria-sort={getOrderValue(order, "ascending", "descending", "none")}
    >
      <Link
        href={href(next)}
        scroll={scroll}
        onClick={() => saveOrdering(cacheKey, next)}
        className="inline-flex max-w-full items-center gap-1 rounded-sm underline-offset-4 focus-ring"
      >
        <span className="truncate">{children}</span>
        <div className={iconClassName}>{icon}</div>
      </Link>
    </TableHead>
  );
}
