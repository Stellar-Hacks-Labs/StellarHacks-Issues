/**
 * Who is asking, and which rows they are allowed to see.
 *
 * `docs/decisions.md` section 5 gives a project three levels. Public is the
 * open gallery. Restricted is the participants-only gallery: a registered
 * reader of that hackathon, the owner, and staff. Private is the team and
 * staff. A missing reader is a signed-out visitor and sees only public rows.
 * Staff and the owner are the two exceptions that cross every level, because
 * both of them already have the row for a reason other than search.
 */
export type Visibility = "public" | "restricted" | "private";

export type Reader = {
  id: string | null;
  staff: boolean;
  registeredHackathons: string[];
};

export type SearchDocument = {
  id: string;
  kind: "hackathon" | "project" | "builder";
  title: string;
  body: string;
  phase: string;
  prizeAsset: string;
  tags: string[];
  country: string;
  hackathonId: string;
  ownerId: string;
  visibility: Visibility;
};

export function visibleTo(document: SearchDocument, reader: Reader): boolean {
  if (document.visibility === "public") return true;
  if (reader.staff) return true;
  if (reader.id !== null && reader.id === document.ownerId) return true;
  if (document.visibility === "restricted") {
    return reader.registeredHackathons.includes(document.hackathonId);
  }
  return false;
}

export function anonymousReader(): Reader {
  return { id: null, staff: false, registeredHackathons: [] };
}
