import { filterListings, type Listing } from "../../../../lib/team-board";
import { Board } from "./board";
import { ListingForm } from "./listing-form";
import { SkillFilter } from "./skill-filter";

export const dynamic = "force-dynamic";

/**
 * The teammate board for one hackathon.
 *
 * Listings are readable only with a reader id. This page is the signed-out
 * view of that rule: it renders the sign-in notice rather than an empty
 * board, so "nobody is looking" and "you cannot see this" stay different
 * sentences. The signed-in list comes from GET /api/team-board.
 */
export default async function TeamBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, asked] = await Promise.all([params, searchParams]);
  const skill = typeof asked.skill === "string" ? asked.skill : null;
  const listings: Listing[] = [];
  const visible = filterListings(listings, skill);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold">Teammate board</h1>
      <p>Sign in to read who is looking for a teammate. A listing closes when that team is full.</p>
      <SkillFilter slug={slug} selected={skill} />
      <Board listings={visible} />
      <ListingForm hackathonId={slug} />
    </main>
  );
}
