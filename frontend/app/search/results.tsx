import type { SearchPage } from "../../lib/search";
import { EmptyState } from "./empty-state";
import { FacetPanel } from "./facet-panel";
import { Pagination } from "./pagination";
import { ResultItem } from "./result-item";

export function Results({ page, q }: { page: SearchPage; q: string }) {
  if (page.total === 0) return <EmptyState q={q} />;
  return (
    <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
      <FacetPanel facets={page.facets} q={q} />
      <div>
        <ol className="flex flex-col gap-4">
          {page.hits.map((hit) => <li key={hit.id}><ResultItem hit={hit} /></li>)}
        </ol>
        <Pagination page={page.page} total={page.total} pageSize={page.pageSize} q={q} />
      </div>
    </div>
  );
}
