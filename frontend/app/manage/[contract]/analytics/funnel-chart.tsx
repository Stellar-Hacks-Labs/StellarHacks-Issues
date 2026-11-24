import { funnelRows, type Funnel } from "../../../../lib/analytics/funnel";
import { DataTable } from "./data-table";
export function FunnelChart({ data }: { data: Funnel }) {
  const rows = funnelRows(data);
  return (
    <section>
      <h2 className="text-xl">Application funnel</h2>
      <div aria-hidden className="mt-4 flex items-end gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="min-w-20 bg-accent p-3 text-center"
            style={{ height: `${48 + row.count * 3}px` }}
          >
            {row.count}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <DataTable caption="Application funnel counts" rows={rows} />
      </div>
    </section>
  );
}
