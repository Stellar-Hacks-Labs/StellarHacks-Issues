import {
  judgePercent,
  type JudgeProgress as Data,
} from "../../../../lib/analytics/judges";
import { DataTable } from "./data-table";
export function JudgeProgress({ data }: { data: Data }) {
  return (
    <section>
      <h2 className="text-xl">Judge progress</h2>
      <p className="mt-3 text-3xl tabular-nums">{judgePercent(data)}%</p>
      <DataTable
        caption="Judge progress counts"
        rows={[
          { label: "Completed", count: data.completed },
          { label: "Expected", count: data.expected },
        ]}
      />
    </section>
  );
}
