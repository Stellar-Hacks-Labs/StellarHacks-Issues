"use client";
import { analyticsCsv } from "../../../../lib/analytics/csv";
import type { OrganizerAnalytics } from "../../../../lib/analytics/shape";
export function ExportCsv({ data }: { data: OrganizerAnalytics }) {
  return (
    <button
      className="underline"
      onClick={() => {
        const url = URL.createObjectURL(
          new Blob([analyticsCsv(data)], { type: "text/csv" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "hackathon-analytics.csv";
        link.click();
        URL.revokeObjectURL(url);
      }}
    >
      Export CSV
    </button>
  );
}
