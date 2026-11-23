import type { Listing } from "./listings";
import type { Team } from "../teams";

export const OPEN_LISTING: Listing = {
  id: "list-1",
  hackathonId: "harbour",
  teamId: 1,
  skills: ["soroban", "frontend"],
  openRoles: ["contract"],
  note: "One seat on the contract side.",
  status: "open",
  readerId: "reader-1",
};

export const FULL_TEAM: Team = { id: 1, captain: "GAAA", members: ["GAAA", "GBBB", "GCCC"] };
export const OPEN_TEAM: Team = { id: 2, captain: "GDDD", members: ["GDDD"] };
