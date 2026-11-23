import type { Decision, Report } from "../../../lib/moderation";
import { DecisionForm } from "./decision-form";
import { History } from "./history";
import { ReportDetail } from "./report-detail";

export function Queue({ reports, decisions }: { reports: Report[]; decisions: Decision[] }) {
  if (reports.length === 0) return <p role="status">The queue is empty.</p>;
  return (
    <div className="flex flex-col gap-6">
      {reports.map((report) => (
        <section key={report.id}>
          <ReportDetail report={report} />
          <DecisionForm reportId={report.id} />
        </section>
      ))}
      <History decisions={decisions} />
    </div>
  );
}
