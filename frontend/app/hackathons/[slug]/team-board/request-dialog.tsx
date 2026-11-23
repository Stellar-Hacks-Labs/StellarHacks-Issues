"use client";

/**
 * Asking to join reuses the request the captain already answers.
 *
 * This dialog collects the note. The signature and the row are written by
 * `askToJoin` in `lib/team-requests.ts`, which is the same request the Find
 * a team tab files. A second request table would split one question across
 * two queues.
 */
export function RequestDialog({ teamId, disabled }: { teamId: number; disabled: boolean }) {
  return (
    <form data-team={teamId}>
      <label htmlFor={`note-${teamId}`}>Note for the captain</label>
      <textarea id={`note-${teamId}`} name="note" disabled={disabled} />
      <button type="submit" disabled={disabled}>{disabled ? "This team is full" : "Request to join"}</button>
    </form>
  );
}
