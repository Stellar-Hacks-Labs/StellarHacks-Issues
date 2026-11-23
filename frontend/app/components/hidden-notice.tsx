/**
 * Shown in place of a write-up that staff hid.
 *
 * The project is still in the result list. This notice is why the write-up
 * is not on the page. It is not a deletion, and it says so.
 */
export function HiddenNotice({ reason }: { reason: string | null }) {
  return (
    <p role="status">
      This is hidden on the platform. It is still part of the on-chain result.
      {reason ? ` Reason: ${reason}` : ""}
    </p>
  );
}
