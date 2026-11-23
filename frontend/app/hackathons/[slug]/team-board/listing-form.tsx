"use client";

export function ListingForm({ hackathonId }: { hackathonId: string }) {
  return (
    <form action="/api/team-board" method="post" className="flex flex-col gap-2">
      <input type="hidden" name="hackathonId" value={hackathonId} />
      <label>Skills <input name="skills" placeholder="soroban, frontend" /></label>
      <label>Open roles <input name="openRoles" placeholder="contract" /></label>
      <label>Note <textarea name="note" maxLength={280} /></label>
      <button type="submit">Post a listing</button>
    </form>
  );
}
