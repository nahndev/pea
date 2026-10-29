import { Card, CardDescription, CardHeader, CardTitle } from '@tomato/ui';
import Link from 'next/link';
import { ADD_ONS } from '../add-ons.constants';

export function AddOnListView() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {ADD_ONS.map(({ slug, name, description }) => (
        <li key={slug}>
          <Link href={`/add-ons/${slug}`} className="block h-full rounded-lg focus-ring">
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle>{name}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
