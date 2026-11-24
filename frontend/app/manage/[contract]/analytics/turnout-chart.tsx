import {
  turnoutPercent,
  type Turnout,
} from "../../../../lib/analytics/turnout";
import { DataTable } from "./data-table";
export function TurnoutChart({ data }: { data: Turnout }) {
  return (
    <section>
      <h2 className="text-xl">Vote turnout</h2>
      <p className="mt-3 text-3xl tabular-nums">{turnoutPercent(data)}%</p>
      <DataTable
        caption="Vote turnout counts"
        rows={[
          { label: "Ballots", count: data.ballots },
          { label: "Eligible voters", count: data.eligible },
        ]}
      />
    </section>
  );
}
