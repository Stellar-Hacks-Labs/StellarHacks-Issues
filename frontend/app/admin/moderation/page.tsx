import { Queue } from "./queue";

export const dynamic = "force-dynamic";

/**
 * The staff queue.
 *
 * This page renders an empty queue for a request that has not been identified
 * as staff. GET /api/reports is what enforces that: a non-staff caller gets
 * 403 and never receives the rows. The page does not fetch them on its own.
 */
export default function ModerationPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold">Moderation</h1>
      <p>A decision hides a page on the platform. It does not change an on-chain result.</p>
      <Queue reports={[]} decisions={[]} />
    </main>
  );
}
