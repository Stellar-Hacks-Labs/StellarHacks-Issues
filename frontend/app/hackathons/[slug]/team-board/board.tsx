import type { Listing } from "../../../../lib/team-board";
import { EmptyState } from "./empty-state";
import { ListingCard } from "./listing-card";
import { RequestDialog } from "./request-dialog";

export function Board({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) return <EmptyState />;
  return (
    <ul className="flex flex-col gap-4">
      {listings.map((listing) => (
        <li key={listing.id}>
          <ListingCard listing={listing} />
          <RequestDialog teamId={listing.teamId} disabled={listing.status !== "open"} />
        </li>
      ))}
    </ul>
  );
}
