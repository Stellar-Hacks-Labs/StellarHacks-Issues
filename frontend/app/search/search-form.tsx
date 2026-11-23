export function SearchForm({ q }: { q: string }) {
  return (
    <form action="/search" role="search" className="flex gap-2">
      <label className="sr-only" htmlFor="search-q">Search</label>
      <input id="search-q" name="q" defaultValue={q} className="flex-1 rounded border border-rule px-3 py-2" />
      <button type="submit" className="rounded border border-rule px-3 py-2">Search</button>
    </form>
  );
}
