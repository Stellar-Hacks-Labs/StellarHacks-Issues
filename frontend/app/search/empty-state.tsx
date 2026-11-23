export function EmptyState({ q }: { q: string }) {
  return <p role="status">{q ? `Nothing matches “${q}”.` : "Type a name, a tag, or a country."}</p>;
}
