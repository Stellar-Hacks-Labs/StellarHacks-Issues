import type { Report } from "../../../lib/moderation";

export function ReportDetail({ report }: { report: Report }) {
  return (
    <article>
      <h2>{report.target.type} {report.target.id}</h2>
      <p>{report.category}</p>
      <p>{report.note}</p>
    </article>
  );
}
