import type { Listing } from "./listings";

/**
 * How much of what the team asked for the reader already has.
 *
 * The score is the size of the overlap. It orders the board. It does not
 * form a team: accepting a request is still the captain's signature.
 */
export function overlap(listing: Listing, readerSkills: string[]): number {
  const theirs = new Set(readerSkills.map((skill) => skill.toLowerCase()));
  return listing.skills.filter((skill) => theirs.has(skill)).length;
}

export function rankListings(listings: Listing[], readerSkills: string[]): Listing[] {
  return [...listings].sort((a, b) => overlap(b, readerSkills) - overlap(a, readerSkills) || a.teamId - b.teamId);
}
