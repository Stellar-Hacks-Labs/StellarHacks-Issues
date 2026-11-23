import { SAMPLE_DOCUMENTS } from "../../lib/search/fixtures";
import { searchCatalog } from "../../lib/search";
import { anonymousReader } from "../../lib/search/read";
import { Results } from "./results";
import { SearchForm } from "./search-form";

export const dynamic = "force-dynamic";

/**
 * One search across hackathons, projects, and builders.
 *
 * Signed-out readers are the anonymous reader. A private or restricted row
 * never reaches `Results` for them. The signed-in case is the same function
 * with a reader built from the session; this page uses the anonymous reader
 * until that session is threaded through, and the tests cover both readers
 * against the same function.
 */
export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const asked = await searchParams;
  const q = typeof asked.q === "string" ? asked.q : "";
  const page = searchCatalog(SAMPLE_DOCUMENTS, anonymousReader(), {
    q,
    phase: typeof asked.phase === "string" ? asked.phase : undefined,
    prizeAsset: typeof asked.prizeAsset === "string" ? asked.prizeAsset : undefined,
    tag: typeof asked.tag === "string" ? asked.tag : undefined,
    country: typeof asked.country === "string" ? asked.country : undefined,
    page: Number(typeof asked.page === "string" ? asked.page : "1") || 1,
  });
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold">Search</h1>
      <SearchForm q={q} />
      <Results page={page} q={q} />
    </main>
  );
}
