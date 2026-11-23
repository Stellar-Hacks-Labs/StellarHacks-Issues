import { withinLimits } from "./limits";
import { knownSkill } from "./skills";

export type Listing = {
  id: string;
  hackathonId: string;
  teamId: number;
  skills: string[];
  openRoles: string[];
  note: string;
  status: "open" | "closed";
  /** Set when the reader is signed in. A missing id means the listing is not readable. */
  readerId: string | null;
};

export function normalizeListing(input: Listing): Listing | { error: string } {
  const skills = input.skills.map((skill) => skill.trim().toLowerCase()).filter((skill) => skill.length > 0);
  const openRoles = input.openRoles.map((role) => role.trim()).filter((role) => role.length > 0);
  const reason = withinLimits({ skills, roles: openRoles, note: input.note });
  if (reason) return { error: reason };
  return { ...input, skills, openRoles };
}

export function readableBy(listing: Listing): boolean {
  return listing.readerId !== null;
}

export function filterListings(listings: Listing[], skill: string | null): Listing[] {
  return listings.filter((listing) => {
    if (!readableBy(listing) || listing.status !== "open") return false;
    if (skill && !listing.skills.includes(skill)) return false;
    return true;
  });
}

export function catalogSkills(listings: Listing[]): string[] {
  return [...new Set(listings.flatMap((listing) => listing.skills.filter(knownSkill)))].sort();
}
