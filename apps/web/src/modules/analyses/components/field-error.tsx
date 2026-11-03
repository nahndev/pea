export function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} role={message ? 'alert' : undefined} className="min-h-0 text-xs text-danger empty:hidden">
      {message}
    </p>
  );
}
