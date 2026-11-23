import type { Listing } from "../../../../lib/team-board";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="rounded border border-rule p-4">
      <h2 className="font-semibold">Team {listing.teamId}</h2>
      <p>{listing.note}</p>
      <ul className="flex flex-wrap gap-2 text-sm">{listing.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
      <p className="text-sm">Open roles: {listing.openRoles.join(", ") || "none named"}</p>
    </article>
  );
}
