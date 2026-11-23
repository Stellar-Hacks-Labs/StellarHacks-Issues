import { hasRoom, type Team } from "../teams";
import type { Listing } from "./listings";

/**
 * A listing closes when the team it describes is full.
 *
 * The size comes from the contract, through `hasRoom`. Closing the listing
 * does not decline a request that was already filed; it stops a new one,
 * because a request for a seat that does not exist would only be refused
 * by the chain after the reader had signed it.
 */
export function closeFilled(listings: Listing[], teams: Team[], maxSize: number): Listing[] {
  const byId = new Map(teams.map((team) => [team.id, team]));
  return listings.map((listing) => {
    const team = byId.get(listing.teamId);
    if (!team) return listing;
    if (!hasRoom(team, maxSize)) return { ...listing, status: "closed" };
    return listing;
  });
}
