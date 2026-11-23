export function Pagination({ page, total, pageSize, q }: { page: number; total: number; pageSize: number; q: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1) return null;
  return (
    <nav aria-label="Pages">
      {page > 1 && <a href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</a>}
      <span> {page} of {pages} </span>
      {page < pages && <a href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</a>}
    </nav>
  );
}
