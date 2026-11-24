import Link from "next/link";
import { readOrganizerAnalytics } from "../../../../lib/analytics/read";
import { EmptyState } from "./empty-state";
import { ExportCsv } from "./export-csv";
import { FunnelChart } from "./funnel-chart";
import { JudgeProgress } from "./judge-progress";
import { TurnoutChart } from "./turnout-chart";
export const dynamic = "force-dynamic";
export default async function Analytics({
  params,
}: PageProps<"/manage/[contract]/analytics">) {
  const { contract } = await params;
  const data = await readOrganizerAnalytics(contract);
  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link href={`/manage/${contract}`} className="underline">
        Back to management
      </Link>
      <h1 className="mt-6 text-3xl">Organizer analytics</h1>
      {data === null ? (
        <EmptyState />
      ) : (
        <>
          <div className="my-6">
            <ExportCsv data={data} />
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            <FunnelChart data={data.funnel} />
            <JudgeProgress data={data.judges} />
            <TurnoutChart data={data.turnout} />
          </div>
        </>
      )}
    </main>
  );
}
