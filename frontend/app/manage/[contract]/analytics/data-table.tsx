export function DataTable({
  caption,
  rows,
}: {
  caption: string;
  rows: { label: string; count: number }[];
}) {
  return (
    <table className="w-full">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th className="text-left">Measure</th>
          <th className="text-right">Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td>{row.label}</td>
            <td className="text-right tabular-nums">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
